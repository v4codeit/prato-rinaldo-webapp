/**
 * Type definitions for the Messaging System
 * Import these types in your components
 */

export type ConversationStatus = 'active' | 'closed';

export interface Conversation {
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

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItemSummary {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
}

export interface UserSummary {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ConversationWithDetails extends Conversation {
  marketplace_item: MarketplaceItemSummary;
  other_participant: UserSummary;
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: UserSummary;
}

/**
 * Return type for server actions
 */
export interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Conversation list item for UI display
 */
export interface ConversationListItem {
  id: string;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessagePreview: string;
  lastMessageAt: Date;
  unreadCount: number;
  status: ConversationStatus;
  isUserBuyer: boolean;
}

/**
 * Message display item for chat UI
 */
export interface MessageDisplayItem {
  id: string;
  content: string;
  senderName: string;
  senderAvatar: string | null;
  isCurrentUser: boolean;
  createdAt: Date;
  isRead: boolean;
}

/**
 * Helper function to format conversation for list display
 */
export function formatConversationForList(
  conversation: ConversationWithDetails,
  currentUserId: string
): ConversationListItem {
  const isUserBuyer = conversation.buyer_id === currentUserId;

  return {
    id: conversation.id,
    itemTitle: conversation.marketplace_item.title,
    itemImage: conversation.marketplace_item.images[0] || '/placeholder-item.jpg',
    itemPrice: conversation.marketplace_item.price,
    otherUserName: conversation.other_participant.name,
    otherUserAvatar: conversation.other_participant.avatar,
    lastMessagePreview: conversation.last_message_preview,
    lastMessageAt: new Date(conversation.last_message_at),
    unreadCount: conversation.unread_count,
    status: conversation.status,
    isUserBuyer,
  };
}

/**
 * Helper function to format message for chat display
 */
export function formatMessageForDisplay(
  message: MessageWithSender,
  currentUserId: string
): MessageDisplayItem {
  return {
    id: message.id,
    content: message.content,
    senderName: message.sender.name,
    senderAvatar: message.sender.avatar,
    isCurrentUser: message.sender_id === currentUserId,
    createdAt: new Date(message.created_at),
    isRead: message.is_read,
  };
}

/**
 * Helper function to get time ago string
 */
export function getTimeAgo(date: Date): string {
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

/**
 * Helper function to format price
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
