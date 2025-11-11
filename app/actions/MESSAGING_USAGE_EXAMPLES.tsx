/**
 * MESSAGING SYSTEM - USAGE EXAMPLES
 *
 * This file contains practical examples of how to use the messaging server actions
 * in your Next.js components. Copy and adapt these patterns to your needs.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getOrCreateConversation,
  getMyConversations,
  getConversationById,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  closeConversation,
  reopenConversation,
} from '@/app/actions/conversations';
import type {
  ConversationWithDetails,
  MessageWithSender,
} from '@/types/messaging';

// ============================================================
// EXAMPLE 1: Contact Seller Button (Marketplace Item Page)
// ============================================================

interface ContactSellerButtonProps {
  itemId: string;
  itemTitle: string;
  isSeller: boolean;
  isSold: boolean;
}

export function ContactSellerButton({
  itemId,
  itemTitle,
  isSeller,
  isSold
}: ContactSellerButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleContactSeller = async () => {
    setIsLoading(true);

    const { data: conversation, error } = await getOrCreateConversation(itemId);

    if (error) {
      alert(error); // Replace with your toast/notification system
      setIsLoading(false);
      return;
    }

    // Navigate to conversation
    router.push(`/messages/${conversation!.id}`);
  };

  // Don't show button if user is seller or item is sold
  if (isSeller || isSold) {
    return null;
  }

  return (
    <button
      onClick={handleContactSeller}
      disabled={isLoading}
      className="btn btn-primary"
    >
      {isLoading ? 'Apertura...' : 'Contatta il venditore'}
    </button>
  );
}

// ============================================================
// EXAMPLE 2: Conversations List Page
// ============================================================

export function ConversationsListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    const { data, error } = await getMyConversations();

    if (error) {
      setError(error);
    } else {
      setConversations(data || []);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Caricamento conversazioni...</div>;
  }

  if (error) {
    return <div className="error">Errore: {error}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="empty-state">
        <p>Non hai ancora conversazioni</p>
        <p>Inizia a chattare con i venditori dalla pagina Marketplace!</p>
      </div>
    );
  }

  return (
    <div className="conversations-list">
      <h1>I miei messaggi</h1>

      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conversation={conv}
          onClick={() => router.push(`/messages/${conv.id}`)}
        />
      ))}
    </div>
  );
}

// ============================================================
// EXAMPLE 3: Conversation List Item Component
// ============================================================

interface ConversationListItemProps {
  conversation: ConversationWithDetails;
  onClick: () => void;
}

function ConversationListItem({ conversation, onClick }: ConversationListItemProps) {
  const itemImage = conversation.marketplace_item.images[0] || '/placeholder.jpg';
  const hasUnread = conversation.unread_count > 0;

  return (
    <div
      className={`conversation-item ${hasUnread ? 'unread' : ''}`}
      onClick={onClick}
    >
      {/* Item Image */}
      <img
        src={itemImage}
        alt={conversation.marketplace_item.title}
        className="item-thumbnail"
      />

      <div className="conversation-details">
        {/* Item Title */}
        <h3>{conversation.marketplace_item.title}</h3>

        {/* Other Participant */}
        <div className="participant">
          <img
            src={conversation.other_participant.avatar || '/default-avatar.png'}
            alt={conversation.other_participant.name}
            className="avatar-small"
          />
          <span>{conversation.other_participant.name}</span>
        </div>

        {/* Last Message Preview */}
        <p className="last-message">
          {conversation.last_message_preview || 'Nessun messaggio ancora'}
        </p>

        {/* Timestamp */}
        <span className="timestamp">
          {formatTimeAgo(new Date(conversation.last_message_at))}
        </span>
      </div>

      {/* Unread Badge */}
      {hasUnread && (
        <span className="unread-badge">{conversation.unread_count}</span>
      )}

      {/* Status Badge */}
      {conversation.status === 'closed' && (
        <span className="status-badge closed">Chiusa</span>
      )}
    </div>
  );
}

// ============================================================
// EXAMPLE 4: Conversation Detail Page (Chat Interface)
// ============================================================

interface ConversationPageProps {
  conversationId: string;
  currentUserId: string;
}

export function ConversationPage({ conversationId, currentUserId }: ConversationPageProps) {
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [conversationId]);

  const loadConversation = async () => {
    const { data, error } = await getConversationById(conversationId);
    if (data) {
      setConversation(data);
    }
  };

  const loadMessages = async () => {
    const { data, error } = await getConversationMessages(conversationId, 50, 0);
    if (data) {
      setMessages(data);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsSending(true);

    const { data: message, error } = await sendMessage(conversationId, newMessage);

    if (error) {
      alert(error);
      setIsSending(false);
      return;
    }

    // Add message to UI optimistically
    setMessages([...messages, message!]);
    setNewMessage('');
    setIsSending(false);

    // Scroll to bottom
    scrollToBottom();
  };

  const handleCloseConversation = async () => {
    if (!confirm('Sei sicuro di voler chiudere questa conversazione?')) return;

    const { error } = await closeConversation(conversationId);

    if (error) {
      alert(error);
      return;
    }

    // Reload conversation to show updated status
    loadConversation();
  };

  const handleReopenConversation = async () => {
    const { error } = await reopenConversation(conversationId);

    if (error) {
      alert(error);
      return;
    }

    loadConversation();
  };

  if (isLoading || !conversation) {
    return <div>Caricamento...</div>;
  }

  const isSeller = conversation.seller_id === currentUserId;
  const isClosed = conversation.status === 'closed';

  return (
    <div className="conversation-page">
      {/* Header */}
      <div className="conversation-header">
        {/* Item Info */}
        <div className="item-info">
          <img
            src={conversation.marketplace_item.images[0]}
            alt={conversation.marketplace_item.title}
          />
          <div>
            <h2>{conversation.marketplace_item.title}</h2>
            <p>{formatPrice(conversation.marketplace_item.price)}</p>
          </div>
        </div>

        {/* Other Participant */}
        <div className="participant-info">
          <img
            src={conversation.other_participant.avatar || '/default-avatar.png'}
            alt={conversation.other_participant.name}
          />
          <span>{conversation.other_participant.name}</span>
        </div>

        {/* Actions (Seller Only) */}
        {isSeller && (
          <div className="conversation-actions">
            {isClosed ? (
              <button onClick={handleReopenConversation} className="btn-secondary">
                Riapri conversazione
              </button>
            ) : (
              <button onClick={handleCloseConversation} className="btn-danger">
                Chiudi conversazione
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>Nessun messaggio ancora</p>
            <p>Inizia la conversazione!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === currentUserId}
            />
          ))
        )}
      </div>

      {/* Message Input */}
      {isClosed ? (
        <div className="conversation-closed-notice">
          <p>Questa conversazione è stata chiusa</p>
          {isSeller && <p>Puoi riaprirla per continuare a chattare</p>}
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="message-input-form">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            maxLength={2000}
            rows={3}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="btn-primary"
          >
            {isSending ? 'Invio...' : 'Invia'}
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================
// EXAMPLE 5: Message Bubble Component
// ============================================================

interface MessageBubbleProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
      {/* Sender Avatar (for received messages) */}
      {!isCurrentUser && (
        <img
          src={message.sender.avatar || '/default-avatar.png'}
          alt={message.sender.name}
          className="message-avatar"
        />
      )}

      <div className="message-content">
        {/* Sender Name (for received messages) */}
        {!isCurrentUser && (
          <span className="sender-name">{message.sender.name}</span>
        )}

        {/* Message Text */}
        <p className="message-text">{message.content}</p>

        {/* Timestamp */}
        <span className="message-timestamp">
          {formatMessageTime(new Date(message.created_at))}
        </span>

        {/* Read Status (for sent messages) */}
        {isCurrentUser && (
          <span className={`read-status ${message.is_read ? 'read' : 'unread'}`}>
            {message.is_read ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXAMPLE 6: Load More Messages (Infinite Scroll)
// ============================================================

export function ConversationWithInfiniteScroll({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreMessages = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    const { data, error } = await getConversationMessages(conversationId, 50, offset);

    if (data) {
      if (data.length < 50) {
        setHasMore(false);
      }

      // Prepend older messages
      setMessages([...data, ...messages]);
      setOffset(offset + data.length);
    }

    setIsLoading(false);
  };

  return (
    <div className="messages-with-infinite-scroll">
      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={loadMoreMessages}
          disabled={isLoading}
          className="load-more-btn"
        >
          {isLoading ? 'Caricamento...' : 'Carica messaggi precedenti'}
        </button>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isCurrentUser={false} // Determine properly
        />
      ))}
    </div>
  );
}

// ============================================================
// EXAMPLE 7: Mark Conversation as Read (on mount)
// ============================================================

export function ConversationWithAutoRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    // Mark conversation as read when component mounts
    markConversationAsRead(conversationId);
  }, [conversationId]);

  return <div>Conversation content...</div>;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ora';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;

  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short'
  });
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}

// ============================================================
// EXAMPLE 8: Server Component (Next.js 16)
// ============================================================

/**
 * Example of using server actions in a Server Component
 */
export async function ConversationServerComponent({
  conversationId
}: {
  conversationId: string
}) {
  // Directly call server action in Server Component
  const { data: conversation, error } = await getConversationById(conversationId);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  return (
    <div>
      <h1>{conversation.marketplace_item.title}</h1>
      <p>Chat with {conversation.other_participant.name}</p>
      {/* Client component for interactive parts */}
      <MessagesList conversationId={conversationId} />
    </div>
  );
}

/**
 * Client component for interactive message list
 */
'use client';
function MessagesList({ conversationId }: { conversationId: string }) {
  // Same implementation as ConversationPage example
  // ...
  return <div>Messages list with form...</div>;
}

// ============================================================
// EXAMPLE 9: Error Handling Pattern
// ============================================================

export async function handleServerActionWithToast<T>(
  action: () => Promise<{ data: T | null; error: string | null }>,
  successMessage?: string
): Promise<T | null> {
  const { data, error } = await action();

  if (error) {
    // Replace with your toast/notification system
    console.error(error);
    alert(error);
    return null;
  }

  if (successMessage) {
    console.log(successMessage);
    // toast.success(successMessage);
  }

  return data;
}

// Usage:
async function exampleUsage() {
  const conversation = await handleServerActionWithToast(
    () => getOrCreateConversation('item-id'),
    'Conversazione creata con successo!'
  );

  if (conversation) {
    // Use conversation data
  }
}

// ============================================================
// EXAMPLE 10: Real-time Updates (Optional Enhancement)
// ============================================================

/**
 * Example of adding real-time updates with Supabase Realtime
 */
export function ConversationWithRealtime({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial load
    loadMessages();

    // Subscribe to new messages (Supabase Realtime)
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Add new message to UI
          const newMessage = payload.new as MessageWithSender;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const loadMessages = async () => {
    const { data } = await getConversationMessages(conversationId);
    if (data) setMessages(data);
  };

  return <div>Messages with real-time updates...</div>;
}
