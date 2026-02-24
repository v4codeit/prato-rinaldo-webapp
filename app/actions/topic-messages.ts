'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  sendTopicMessageSchema,
  editTopicMessageSchema,
  topicReactionSchema,
} from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import type {
  TopicMessage,
  TopicMessageWithAuthor,
  ActionResponse,
  PaginatedResponse,
  GetMessagesParams,
  SendMessageInput,
  TopicMessageMetadata,
} from '@/types/topics';
import type { Json } from '@/lib/supabase/database.types';

/**
 * Get messages for a topic with pagination
 * Uses separate queries for reply_to to avoid PostgREST self-join issues
 */
export async function getTopicMessages(
  topicId: string,
  params?: GetMessagesParams
): Promise<ActionResponse<PaginatedResponse<TopicMessageWithAuthor>>> {
  try {
    const supabase = await createClient();
    const limit = params?.limit || 50;

    // Step 1: Fetch messages WITHOUT self-join (avoids PostgREST array issue)
    let query = supabase
      .from('topic_messages')
      .select(
        `
        *,
        author:users!author_id(id, name, email, avatar),
        message_reactions:topic_message_reactions(id, emoji, user_id)
      `
      )
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check hasMore

    // Cursor-based pagination
    if (params?.before) {
      const { data: cursorMessage } = await supabase
        .from('topic_messages')
        .select('created_at')
        .eq('id', params.before)
        .single();

      if (cursorMessage) {
        query = query.lt('created_at', cursorMessage.created_at);
      }
    }

    if (params?.after) {
      const { data: cursorMessage } = await supabase
        .from('topic_messages')
        .select('created_at')
        .eq('id', params.after)
        .single();

      if (cursorMessage) {
        query = query.gt('created_at', cursorMessage.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return { data: null, error: 'Errore nel caricamento dei messaggi' };
    }

    // Check if there are more messages
    const hasMore = (messages?.length || 0) > limit;
    const resultMessages = hasMore ? messages?.slice(0, limit) : messages;

    // Step 2: Fetch reply_to messages separately (RELIABLE - no self-join issues)
    const replyIds = (resultMessages || [])
      .map((m) => m.reply_to_id)
      .filter((id): id is string => id !== null);

    let replyMap: Record<string, TopicMessageWithAuthor> = {};

    if (replyIds.length > 0) {
      const { data: replyMessages } = await supabase
        .from('topic_messages')
        .select(
          `
          id, content, author_id,
          author:users!author_id(id, name, email, avatar)
        `
        )
        .in('id', replyIds)
        .eq('is_deleted', false);

      if (replyMessages) {
        replyMap = Object.fromEntries(
          replyMessages.map((r) => [r.id, r as unknown as TopicMessageWithAuthor])
        );
      }
    }

    // Step 3: Merge reply_to data into messages
    const messagesWithReplies: TopicMessageWithAuthor[] = (resultMessages || []).map((m) => ({
      ...m,
      reply_to: m.reply_to_id ? replyMap[m.reply_to_id] || null : null,
    })) as TopicMessageWithAuthor[];

    // Reverse to show oldest first in UI
    const orderedMessages = messagesWithReplies.reverse();

    return {
      data: {
        data: orderedMessages,
        hasMore,
      },
      error: null,
    };
  } catch (err) {
    console.error('Exception in getTopicMessages:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Send a message to a topic
 */
export async function sendTopicMessage(
  topicId: string,
  input: SendMessageInput
): Promise<ActionResponse<TopicMessageWithAuthor>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validate input
    const parsed = sendTopicMessageSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    const { content, replyToId, mentions, metadata } = parsed.data;

    // Check topic exists and user can write
    // RLS will handle permissions, but we want better error messages
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug, write_permission, tenant_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return { data: null, error: 'Topic non trovato' };
    }

    // Verify reply_to message exists if provided
    if (replyToId) {
      const { data: replyMessage } = await supabase
        .from('topic_messages')
        .select('id, content')
        .eq('id', replyToId)
        .eq('topic_id', topicId)
        .eq('is_deleted', false)
        .single();

      if (!replyMessage) {
        return { data: null, error: 'Messaggio di risposta non trovato' };
      }
    }

    // Create message
    // Note: mentions are stored in metadata JSONB field (no dedicated column)
    const messageMetadata: Record<string, unknown> = {
      ...(metadata || {}),
    };
    if (mentions && mentions.length > 0) {
      messageMetadata.mentions = mentions;
    }

    // Build insert object
    const insertData = {
      topic_id: topicId,
      author_id: user.id,
      content,
      metadata: Object.keys(messageMetadata).length > 0 ? (messageMetadata as Json) : null,
      reply_to_id: replyToId || null,
    };

    // Step 1: Insert message WITHOUT self-join (avoids PostgREST array issue)
    const { data: message, error: insertError } = await supabase
      .from('topic_messages')
      .insert(insertData)
      .select(
        `
        *,
        author:users!author_id(id, name, email, avatar)
      `
      )
      .single();

    if (insertError) {
      console.error('[sendTopicMessage] INSERT ERROR:', insertError);
      if (insertError.code === '42501') {
        return { data: null, error: 'Non hai i permessi per scrivere in questo topic' };
      }
      return { data: null, error: 'Errore nell\'invio del messaggio' };
    }

    // Step 2: Fetch reply_to separately if needed (RELIABLE - no self-join issues)
    let replyToData: TopicMessageWithAuthor | null = null;

    if (message?.reply_to_id) {
      const { data: replyMessage } = await supabase
        .from('topic_messages')
        .select(
          `
          id, content, author_id,
          author:users!author_id(id, name, email, avatar)
        `
        )
        .eq('id', message.reply_to_id)
        .eq('is_deleted', false)
        .single();

      if (replyMessage) {
        replyToData = replyMessage as unknown as TopicMessageWithAuthor;
      }
    }

    // Step 3: Build complete message with reply_to
    const completeMessage: TopicMessageWithAuthor = {
      ...message,
      reply_to: replyToData,
    } as TopicMessageWithAuthor;

    // Revalidate paths
    revalidatePath(`${ROUTES.COMMUNITY}/${topic.slug}`);

    return { data: completeMessage, error: null };
  } catch (err) {
    console.error('Exception in sendTopicMessage:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Edit a message (author only, within time limit)
 */
export async function editTopicMessage(
  messageId: string,
  content: string
): Promise<ActionResponse<TopicMessage>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validate content
    const parsed = editTopicMessageSchema.safeParse({ content });
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    // Get message and verify ownership
    const { data: message, error: fetchError } = await supabase
      .from('topic_messages')
      .select('*, topics!topic_id(slug)')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return { data: null, error: 'Messaggio non trovato' };
    }

    if (message.author_id !== user.id) {
      return { data: null, error: 'Non puoi modificare questo messaggio' };
    }

    if (message.is_deleted) {
      return { data: null, error: 'Messaggio già eliminato' };
    }

    // Update message
    const { data: updated, error: updateError } = await supabase
      .from('topic_messages')
      .update({
        content: parsed.data.content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error editing message:', updateError);
      return { data: null, error: 'Errore nella modifica del messaggio' };
    }

    revalidatePath(`${ROUTES.COMMUNITY}/${(message as any).topics?.slug}`);

    return { data: updated as TopicMessage, error: null };
  } catch (err) {
    console.error('Exception in editTopicMessage:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Soft delete a message (author or moderator)
 */
export async function deleteTopicMessage(
  messageId: string
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get message
    const { data: message, error: fetchError } = await supabase
      .from('topic_messages')
      .select('*, topics!topic_id(slug)')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return { data: null, error: 'Messaggio non trovato' };
    }

    // Check permission: author, topic moderator, or admin
    const isAuthor = message.author_id === user.id;

    let canDelete = isAuthor;

    if (!canDelete) {
      // Check if user is moderator/admin of the topic
      const { data: membership } = await supabase
        .from('topic_members')
        .select('role')
        .eq('topic_id', message.topic_id)
        .eq('user_id', user.id)
        .single();

      if (membership && ['moderator', 'admin'].includes(membership.role)) {
        canDelete = true;
      }

      // Or if user is platform admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData && ['admin', 'super_admin'].includes(userData.role)) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return { data: null, error: 'Non hai i permessi per eliminare questo messaggio' };
    }

    // Soft delete
    const { error: updateError } = await supabase
      .from('topic_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error deleting message:', updateError);
      return { data: null, error: 'Errore nell\'eliminazione del messaggio' };
    }

    revalidatePath(`${ROUTES.COMMUNITY}/${(message as any).topics?.slug}`);

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in deleteTopicMessage:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Toggle a reaction on a message
 * - If user has no reaction: add it
 * - If user has same emoji: remove it (toggle off)
 * - If user has different emoji: change it (one reaction per user per message)
 */
export async function toggleReaction(
  messageId: string,
  emoji: string
): Promise<ActionResponse<{ action: 'added' | 'removed' | 'changed' }>> {
  try {
    // Validate messageId is a valid UUID
    if (!messageId || messageId === 'undefined' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      console.error('Invalid messageId:', messageId);
      return { data: null, error: 'ID messaggio non valido' };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Check if user already has a reaction on this message
    const { data: existingReaction } = await supabase
      .from('topic_message_reactions')
      .select('id, emoji')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    // Case 1: No existing reaction → ADD
    if (!existingReaction) {
      const { error } = await supabase
        .from('topic_message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error) {
        console.error('Error adding reaction:', error);
        return { data: null, error: 'Errore nell\'aggiunta della reazione' };
      }
      return { data: { action: 'added' }, error: null };
    }

    // Case 2: Same emoji → TOGGLE OFF (remove)
    if (existingReaction.emoji === emoji) {
      const { error } = await supabase
        .from('topic_message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing reaction:', error);
        return { data: null, error: 'Errore nella rimozione della reazione' };
      }
      return { data: { action: 'removed' }, error: null };
    }

    // Case 3: Different emoji → CHANGE (update)
    const { error } = await supabase
      .from('topic_message_reactions')
      .update({ emoji })
      .eq('id', existingReaction.id);

    if (error) {
      console.error('Error changing reaction:', error);
      return { data: null, error: 'Errore nel cambio della reazione' };
    }
    return { data: { action: 'changed' }, error: null };

  } catch (err) {
    console.error('Exception in toggleReaction:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Mark all messages in a topic as read
 */
export async function markTopicAsRead(topicId: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get latest message
    const { data: latestMessage } = await supabase
      .from('topic_messages')
      .select('id')
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Update membership
    const { error } = await supabase
      .from('topic_members')
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString(),
        last_read_message_id: latestMessage?.id || null,
      })
      .eq('topic_id', topicId)
      .eq('user_id', user.id);

    if (error) {
      // Might not be a member yet, try to create membership
      if (error.code === 'PGRST116') {
        // No rows updated - user is not a member
        // For public/verified topics, auto-join
        const { error: joinError } = await supabase
          .from('topic_members')
          .insert({
            topic_id: topicId,
            user_id: user.id,
            role: 'writer',
            unread_count: 0,
            last_read_at: new Date().toISOString(),
            last_read_message_id: latestMessage?.id || null,
          });

        if (joinError && joinError.code !== '23505') {
          // Not a duplicate key error
          console.error('Error creating membership:', joinError);
        }
      }
    }

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in markTopicAsRead:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Upload an image for a topic message
 */
export async function uploadTopicImage(
  topicId: string,
  formData: FormData
): Promise<ActionResponse<TopicMessageMetadata>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { data: null, error: 'Nessun file caricato' };
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { data: null, error: 'Il file è troppo grande (max 5MB)' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { data: null, error: 'Tipo di file non supportato' };
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${topicId}/${user.id}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('topic-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { data: null, error: 'Errore nel caricamento dell\'immagine' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('topic-images').getPublicUrl(uploadData.path);

    // Get image dimensions (optional, could be done client-side)
    const metadata: TopicMessageMetadata = {
      url: publicUrl,
    };

    return { data: metadata, error: null };
  } catch (err) {
    console.error('Exception in uploadTopicImage:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Upload a voice message for a topic
 * Returns metadata with URL and waveform for the message
 */
export async function uploadTopicAudio(
  topicId: string,
  formData: FormData
): Promise<ActionResponse<TopicMessageMetadata>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { data: null, error: 'Nessun file audio caricato' };
    }

    // Get metadata from form
    const duration = parseFloat(formData.get('duration') as string) || 0;
    const mimeType = (formData.get('mimeType') as string) || file.type;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { data: null, error: 'Il file audio è troppo grande (max 10MB)' };
    }

    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    const fileType = file.type || mimeType;
    if (!allowedTypes.some(t => fileType.includes(t.split('/')[1]))) {
      return { data: null, error: 'Tipo di file audio non supportato' };
    }

    // Generate unique filename
    const ext = mimeType.includes('webm') ? 'webm' :
                mimeType.includes('mp4') ? 'm4a' :
                mimeType.includes('mpeg') ? 'mp3' :
                mimeType.includes('ogg') ? 'ogg' : 'wav';
    const filename = `${topicId}/${user.id}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('topic-audio')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (uploadError) {
      console.error('Error uploading audio:', uploadError);
      return { data: null, error: 'Errore nel caricamento dell\'audio' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('topic-audio').getPublicUrl(uploadData.path);

    // Generate waveform from audio data
    // For server-side, we generate a simple random waveform
    // In production, you might want to process the actual audio
    const waveform = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 80) + 20
    );

    const metadata: TopicMessageMetadata = {
      url: publicUrl,
      voice: {
        duration,
        size: file.size,
        mimeType,
        waveform,
      },
    };

    return { data: metadata, error: null };
  } catch (err) {
    console.error('Exception in uploadTopicAudio:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Send a voice message to a topic
 * Combines upload and message creation in one action
 */
export async function sendVoiceMessage(
  topicId: string,
  formData: FormData
): Promise<ActionResponse<TopicMessageWithAuthor>> {
  try {
    // First upload the audio
    const uploadResult = await uploadTopicAudio(topicId, formData);

    if (uploadResult.error || !uploadResult.data) {
      return { data: null, error: uploadResult.error || 'Errore nel caricamento' };
    }

    // Then send the message with voice metadata
    const duration = parseFloat(formData.get('duration') as string) || 0;
    const messageContent = `Messaggio vocale (${Math.floor(duration)}s)`;

    const messageResult = await sendTopicMessage(topicId, {
      content: messageContent,
      metadata: uploadResult.data as unknown as Record<string, unknown>,
    });

    if (messageResult.error || !messageResult.data) {
      return { data: null, error: messageResult.error || 'Errore nell\'invio' };
    }

    // Update the message type to 'voice'
    const supabase = await createClient();
    await supabase
      .from('topic_messages')
      .update({ message_type: 'voice' })
      .eq('id', messageResult.data.id);

    // Return the message with updated type
    return {
      data: {
        ...messageResult.data,
        message_type: 'voice',
      },
      error: null,
    };
  } catch (err) {
    console.error('Exception in sendVoiceMessage:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

// ============================================================================
// LINK PREVIEW
// ============================================================================

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  domain: string;
}

// Simple in-memory cache for link previews (per server instance)
const linkPreviewCache = new Map<string, { data: LinkPreviewData; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Fetch Open Graph metadata for a URL (server-side)
 */
export async function fetchLinkPreview(url: string): Promise<ActionResponse<LinkPreviewData>> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { data: null, error: 'URL non valido' };
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { data: null, error: 'Protocollo non supportato' };
    }

    const domain = parsedUrl.hostname;

    // Check cache
    const cached = linkPreviewCache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { data: cached.data, error: null };
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { data: null, error: 'Impossibile caricare la pagina' };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { data: null, error: 'Non è una pagina HTML' };
    }

    // Only read first 50KB to avoid downloading huge pages
    const reader = response.body?.getReader();
    if (!reader) {
      return { data: null, error: 'Nessun contenuto' };
    }

    let html = '';
    const decoder = new TextDecoder();
    let bytesRead = 0;
    const maxBytes = 50 * 1024;

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.length;
    }
    reader.cancel();

    // Extract OG meta tags with regex (no DOM parser needed on server)
    const getMetaContent = (property: string): string | null => {
      // Match both property="og:X" and name="X" patterns
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        'i'
      );
      const match = html.match(regex);
      return match?.[1] || match?.[2] || null;
    };

    const getTitle = (): string | null => {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      return titleMatch?.[1]?.trim() || null;
    };

    const title = getMetaContent('og:title') || getTitle();
    const description = getMetaContent('og:description') || getMetaContent('description');
    const image = getMetaContent('og:image');
    const siteName = getMetaContent('og:site_name');

    // Resolve relative image URL
    const resolvedImage = image && !image.startsWith('http')
      ? new URL(image, url).href
      : image;

    const preview: LinkPreviewData = {
      url,
      title: title ? title.slice(0, 200) : null,
      description: description ? description.slice(0, 300) : null,
      image: resolvedImage,
      siteName: siteName ? siteName.slice(0, 100) : null,
      domain,
    };

    // Store in cache
    linkPreviewCache.set(url, { data: preview, ts: Date.now() });

    return { data: preview, error: null };
  } catch (err) {
    // AbortError = timeout
    if (err instanceof Error && err.name === 'AbortError') {
      return { data: null, error: 'Timeout' };
    }
    return { data: null, error: 'Errore nel recupero anteprima' };
  }
}
