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
 */
export async function getTopicMessages(
  topicId: string,
  params?: GetMessagesParams
): Promise<ActionResponse<PaginatedResponse<TopicMessageWithAuthor>>> {
  try {
    const supabase = await createClient();
    const limit = params?.limit || 50;

    // Build query - include reactions from topic_message_reactions
    let query = supabase
      .from('topic_messages')
      .select(
        `
        *,
        author:users!author_id(id, name, email, avatar),
        reply_to:topic_messages!reply_to_id(
          id, content, author_id,
          author:users!author_id(id, name, email, avatar)
        ),
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

    // Reverse to show oldest first in UI
    const orderedMessages = (resultMessages || []).reverse() as TopicMessageWithAuthor[];

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
        .select('id')
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

    const { data: message, error: insertError } = await supabase
      .from('topic_messages')
      .insert({
        topic_id: topicId,
        author_id: user.id,
        content,
        metadata: Object.keys(messageMetadata).length > 0 ? (messageMetadata as Json) : null,
        reply_to_id: replyToId || null,
      })
      .select(
        `
        *,
        author:users!author_id(id, name, email, avatar),
        reply_to:topic_messages!reply_to_id(
          id, content, author_id,
          author:users!author_id(id, name, email, avatar)
        )
      `
      )
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return { data: null, error: 'Non hai i permessi per scrivere in questo topic' };
      }
      return { data: null, error: 'Errore nell\'invio del messaggio' };
    }

    // Revalidate paths
    revalidatePath(`${ROUTES.COMMUNITY}/${topic.slug}`);

    return { data: message as unknown as TopicMessageWithAuthor, error: null };
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
