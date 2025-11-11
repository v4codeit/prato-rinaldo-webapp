'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendMessageSchema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';

/**
 * Type definitions for conversation and message data
 */
type ConversationStatus = 'active' | 'closed';

interface Conversation {
  id: string;
  marketplace_item_id: string;
  buyer_id: string;
  seller_id: string;
  tenant_id: string;
  status: ConversationStatus;
  last_message_at: string;
  last_message_preview: string;
  unread_count_buyer: number;
  unread_count_seller: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversationWithDetails extends Conversation {
  marketplace_item: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
  };
  other_participant: {
    id: string;
    name: string;
    avatar: string | null;
  };
  unread_count: number;
}

interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

/**
 * Get or create a conversation between buyer and seller for a marketplace item
 *
 * @param marketplaceItemId - The marketplace item ID
 * @returns Conversation with item and seller details or error
 */
export async function getOrCreateConversation(marketplaceItemId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get marketplace item details
    const { data: itemData, error: itemError } = await supabase
      .from('marketplace_items')
      .select('id, title, price, images, status, seller_id, tenant_id')
      .eq('id', marketplaceItemId)
      .single();

    if (itemError || !itemData) {
      return { data: null, error: 'Articolo non trovato' };
    }

    const item = itemData as any;

    // Prevent seller from messaging themselves
    if (item.seller_id === user.id) {
      return { data: null, error: 'Non puoi inviare messaggi a te stesso' };
    }

    // Check if item is available
    if (item.status === 'sold') {
      return { data: null, error: 'Questo articolo è già stato venduto' };
    }

    // Check if conversation already exists
    const { data: existingConversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        marketplace_item:marketplace_items!marketplace_item_id(id, title, price, images, status),
        seller:users!seller_id(id, name, avatar)
      `)
      .eq('marketplace_item_id', marketplaceItemId)
      .eq('buyer_id', user.id)
      .single();

    if (existingConversation) {
      // Return existing conversation
      const conv = existingConversation as any;
      const conversation: ConversationWithDetails = {
        id: conv.id,
        marketplace_item_id: conv.marketplace_item_id,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        tenant_id: conv.tenant_id,
        status: conv.status,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        unread_count_buyer: conv.unread_count_buyer,
        unread_count_seller: conv.unread_count_seller,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        marketplace_item: conv.marketplace_item,
        other_participant: conv.seller,
        unread_count: conv.unread_count_buyer,
      };
      return { data: conversation, error: null };
    }

    // Get seller info for the new conversation
    const { data: sellerData, error: sellerError } = await supabase
      .from('users')
      .select('id, name, avatar')
      .eq('id', item.seller_id)
      .single();

    if (sellerError || !sellerData) {
      return { data: null, error: 'Venditore non trovato' };
    }

    const seller = sellerData as any;

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        marketplace_item_id: marketplaceItemId,
        buyer_id: user.id,
        seller_id: item.seller_id,
        tenant_id: item.tenant_id,
        status: 'active' as ConversationStatus,
        last_message_at: new Date().toISOString(),
        last_message_preview: '',
        unread_count_buyer: 0,
        unread_count_seller: 0,
      })
      .select()
      .single();

    if (createError || !newConversation) {
      return { data: null, error: 'Errore durante la creazione della conversazione' };
    }

    // Return new conversation with details
    const newConv = newConversation as any;
    const conversation: ConversationWithDetails = {
      id: newConv.id,
      marketplace_item_id: newConv.marketplace_item_id,
      buyer_id: newConv.buyer_id,
      seller_id: newConv.seller_id,
      tenant_id: newConv.tenant_id,
      status: newConv.status,
      last_message_at: newConv.last_message_at,
      last_message_preview: newConv.last_message_preview || '',
      unread_count_buyer: newConv.unread_count_buyer,
      unread_count_seller: newConv.unread_count_seller,
      created_at: newConv.created_at,
      updated_at: newConv.updated_at,
      marketplace_item: {
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.images as string[],
        status: item.status,
      },
      other_participant: seller,
      unread_count: 0,
    };

    revalidatePath(ROUTES.MARKETPLACE);
    return { data: conversation, error: null };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Get all conversations for the current user (as buyer or seller)
 *
 * @returns Array of conversations with details sorted by last message
 */
export async function getMyConversations() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get conversations where user is buyer or seller
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        marketplace_item:marketplace_items!marketplace_item_id(id, title, price, images, status),
        buyer:users!buyer_id(id, name, avatar),
        seller:users!seller_id(id, name, avatar)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error || !conversations) {
      return { data: null, error: 'Errore durante il caricamento delle conversazioni' };
    }

    // Format conversations with other participant and unread count
    const conversationsData = conversations as any[];
    const formattedConversations: ConversationWithDetails[] = conversationsData.map((conv) => {
      const isBuyer = conv.buyer_id === user.id;
      return {
        id: conv.id,
        marketplace_item_id: conv.marketplace_item_id,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        tenant_id: conv.tenant_id,
        status: conv.status,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        unread_count_buyer: conv.unread_count_buyer,
        unread_count_seller: conv.unread_count_seller,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        marketplace_item: conv.marketplace_item,
        other_participant: isBuyer ? conv.seller : conv.buyer,
        unread_count: isBuyer ? conv.unread_count_buyer : conv.unread_count_seller,
      };
    });

    return { data: formattedConversations, error: null };
  } catch (error) {
    console.error('Error in getMyConversations:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Get single conversation with full details
 * Resets unread count for current user
 *
 * @param conversationId - The conversation ID
 * @returns Conversation with full details or error
 */
export async function getConversationById(conversationId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get conversation with details
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        marketplace_item:marketplace_items!marketplace_item_id(id, title, price, images, status),
        buyer:users!buyer_id(id, name, avatar),
        seller:users!seller_id(id, name, avatar)
      `)
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    // Verify user is participant
    const isParticipant = conv.buyer_id === user.id || conv.seller_id === user.id;
    if (!isParticipant) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Determine if user is buyer or seller
    const isBuyer = conv.buyer_id === user.id;

    // Reset unread count for current user
    const updateField = isBuyer ? 'unread_count_buyer' : 'unread_count_seller';
    await supabase
      .from('conversations')
      .update({ [updateField]: 0 })
      .eq('id', conversationId);

    // Format conversation - manually construct to avoid spread type errors
    const formattedConversation: ConversationWithDetails = {
      id: conv.id,
      marketplace_item_id: conv.marketplace_item_id,
      buyer_id: conv.buyer_id,
      seller_id: conv.seller_id,
      tenant_id: conv.tenant_id,
      status: conv.status,
      last_message_at: conv.last_message_at,
      last_message_preview: conv.last_message_preview,
      unread_count_buyer: conv.unread_count_buyer,
      unread_count_seller: conv.unread_count_seller,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      marketplace_item: conv.marketplace_item,
      other_participant: isBuyer ? conv.seller : conv.buyer,
      unread_count: 0,
    };

    return { data: formattedConversation, error: null };
  } catch (error) {
    console.error('Error in getConversationById:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Get messages for a conversation with pagination
 * Marks messages as read for current user
 *
 * @param conversationId - The conversation ID
 * @param limit - Number of messages to fetch (default: 50)
 * @param offset - Number of messages to skip (default: 0)
 * @returns Array of messages with sender info or error
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    const isParticipant = conv.buyer_id === user.id || conv.seller_id === user.id;
    if (!isParticipant) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Get messages with sender info
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, avatar)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error || !messages) {
      return { data: null, error: 'Errore durante il caricamento dei messaggi' };
    }

    // Mark unread messages as read (where sender is not current user)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    // Cast to any to avoid type errors, then map to properly typed objects
    const messagesData = messages as any[];
    const formattedMessages: MessageWithSender[] = messagesData.map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender: msg.sender,
    }));

    return { data: formattedMessages, error: null };
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Send a new message in a conversation
 *
 * @param conversationId - The conversation ID
 * @param content - The message content (1-2000 chars)
 * @returns Created message or error
 */
export async function sendMessage(conversationId: string, content: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validate content
    const trimmedContent = content.trim();
    const parsed = sendMessageSchema.safeParse({ content: trimmedContent });
    if (!parsed.success) {
      const error = parsed.error.flatten().fieldErrors.content?.[0] || 'Contenuto non valido';
      return { data: null, error };
    }

    // Get conversation and verify user is participant
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, status, tenant_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    const isParticipant = conv.buyer_id === user.id || conv.seller_id === user.id;
    if (!isParticipant) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Check conversation status
    if (conv.status === 'closed') {
      return { data: null, error: 'Questa conversazione è stata chiusa' };
    }

    // Determine if user is buyer or seller
    const isBuyer = conv.buyer_id === user.id;

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: parsed.data.content,
        is_read: false,
      })
      .select(`
        *,
        sender:users!sender_id(id, name, avatar)
      `)
      .single();

    if (insertError || !message) {
      return { data: null, error: 'Errore durante l\'invio del messaggio' };
    }

    // Update conversation: last_message_at, last_message_preview, and increment unread count
    const updateField = isBuyer ? 'unread_count_seller' : 'unread_count_buyer';
    const { data: currentConv } = await supabase
      .from('conversations')
      .select(updateField)
      .eq('id', conversationId)
      .single();

    // Cast to any to access dynamic property
    const currentUnreadCount = (currentConv as any)?.[updateField] || 0;

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: parsed.data.content.substring(0, 100),
        [updateField]: currentUnreadCount + 1,
      })
      .eq('id', conversationId);

    // Revalidate paths
    revalidatePath('/messages');
    revalidatePath(`/messages/${conversationId}`);

    // Send email notification (non-blocking - don't wait for it)
    // Import is at the top of the file
    import('@/app/actions/email-notifications').then(({ notifyNewMessage }) => {
      notifyNewMessage({
        conversationId,
        senderId: user.id,
        messageContent: parsed.data.content,
      }).catch((err) => {
        console.error('Failed to send email notification:', err);
      });
    });

    // Cast to any and manually construct typed object
    const msg = message as any;
    const formattedMessage: MessageWithSender = {
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender: msg.sender,
    };

    return { data: formattedMessage, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Mark all messages in a conversation as read for current user
 *
 * @param conversationId - The conversation ID
 * @returns Success status or error
 */
export async function markConversationAsRead(conversationId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get conversation and verify user is participant
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    const isParticipant = conv.buyer_id === user.id || conv.seller_id === user.id;
    if (!isParticipant) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Mark all messages as read (where sender is not current user)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    // Reset unread count for current user
    const isBuyer = conv.buyer_id === user.id;
    const updateField = isBuyer ? 'unread_count_buyer' : 'unread_count_seller';

    await supabase
      .from('conversations')
      .update({ [updateField]: 0 })
      .eq('id', conversationId);

    revalidatePath('/messages');
    revalidatePath(`/messages/${conversationId}`);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error in markConversationAsRead:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Close a conversation (seller only)
 * Sets status to 'closed', preventing new messages
 *
 * @param conversationId - The conversation ID
 * @returns Success status or error
 */
export async function closeConversation(conversationId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, seller_id, status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    // Verify current user is the seller
    if (conv.seller_id !== user.id) {
      return { data: null, error: 'Solo il venditore può chiudere la conversazione' };
    }

    // Check if already closed
    if (conv.status === 'closed') {
      return { data: null, error: 'La conversazione è già chiusa' };
    }

    // Update conversation status
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: 'closed' as ConversationStatus })
      .eq('id', conversationId);

    if (updateError) {
      return { data: null, error: 'Errore durante la chiusura della conversazione' };
    }

    revalidatePath('/messages');
    revalidatePath(`/messages/${conversationId}`);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error in closeConversation:', error);
    return { data: null, error: 'Errore del server' };
  }
}

/**
 * Reopen a closed conversation (seller only)
 * Sets status back to 'active'
 *
 * @param conversationId - The conversation ID
 * @returns Success status or error
 */
export async function reopenConversation(conversationId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, seller_id, status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return { data: null, error: 'Conversazione non trovata' };
    }

    // Cast to any to avoid type errors
    const conv = conversation as any;

    // Verify current user is the seller
    if (conv.seller_id !== user.id) {
      return { data: null, error: 'Solo il venditore può riaprire la conversazione' };
    }

    // Check if already active
    if (conv.status === 'active') {
      return { data: null, error: 'La conversazione è già attiva' };
    }

    // Update conversation status
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: 'active' as ConversationStatus })
      .eq('id', conversationId);

    if (updateError) {
      return { data: null, error: 'Errore durante la riapertura della conversazione' };
    }

    revalidatePath('/messages');
    revalidatePath(`/messages/${conversationId}`);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error in reopenConversation:', error);
    return { data: null, error: 'Errore del server' };
  }
}
