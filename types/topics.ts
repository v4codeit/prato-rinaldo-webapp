/**
 * Type definitions for the Topics System (Telegram-style chat)
 * Import these types in your components
 */

// =====================================================
// ENUM TYPES (matching database ENUMs)
// =====================================================

export type TopicVisibility = 'public' | 'authenticated' | 'verified' | 'members_only';
export type TopicWritePermission = 'all_viewers' | 'verified' | 'members_only' | 'admins_only';
export type TopicMemberRole = 'viewer' | 'writer' | 'moderator' | 'admin';
export type TopicMessageType = 'text' | 'system' | 'auto_post' | 'image' | 'voice';

// =====================================================
// BASE INTERFACES (matching database tables)
// =====================================================

export interface Topic {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  visibility: TopicVisibility;
  write_permission: TopicWritePermission;
  is_default: boolean;
  sort_order: number;
  message_count: number;
  member_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicMember {
  id: string;
  topic_id: string;
  user_id: string;
  role: TopicMemberRole;
  is_muted: boolean;
  last_read_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopicMessage {
  id: string;
  topic_id: string;
  author_id: string | null;
  content: string;
  message_type: TopicMessageType;
  metadata: Record<string, unknown> | null;
  reply_to_id: string | null;
  reactions: Record<string, unknown> | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: string;
}

// =====================================================
// METADATA TYPES
// =====================================================

export interface VoiceMessageMetadata {
  duration: number;      // duration in seconds
  size: number;          // file size in bytes
  mimeType: string;      // audio/webm, audio/mp4, etc.
  waveform: number[];    // 64 samples, 0-127 values for visualization
}

/**
 * Image attachment for multi-image messages
 */
export interface ImageAttachment {
  url: string;
  width?: number;
  height?: number;
}

export interface TopicMessageMetadata {
  // For multi-image messages (NEW)
  images?: ImageAttachment[];

  // For single image messages (LEGACY - kept for backward compatibility)
  url?: string;
  width?: number;
  height?: number;
  alt?: string;

  // For auto_post messages
  source_type?: 'events' | 'marketplace' | 'proposals';
  source_id?: string;
  title?: string;
  // For mentions
  mentions?: string[];
  // For voice messages
  voice?: VoiceMessageMetadata;
}

// =====================================================
// EXTENDED INTERFACES (with relations)
// =====================================================

export interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

export interface TopicWithUnread extends Topic {
  unread_count: number;
  is_member: boolean;
  my_role: TopicMemberRole | null;
}

export interface TopicWithMembers extends Topic {
  members: TopicMemberWithUser[];
}

export interface TopicMemberWithUser extends TopicMember {
  user: UserSummary;
}

export interface TopicMessageReactionFromDB {
  id: string;
  emoji: string;
  user_id: string;
}

export interface TopicMessageWithAuthor extends TopicMessage {
  author: UserSummary | null;
  reply_to?: TopicMessageWithAuthor | null;
  /** Reactions loaded from database join (named differently to avoid conflict with base reactions field) */
  message_reactions?: TopicMessageReactionFromDB[];
}

// =====================================================
// UI DISPLAY TYPES
// =====================================================

export interface TopicListItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
  description: string | null;
  unreadCount: number;
  memberCount: number;
  messageCount: number;
  visibility: TopicVisibility;
  writePermission: TopicWritePermission;
  isDefault: boolean;
  isMember: boolean;
  myRole: TopicMemberRole | null;
}

export interface MessageDisplayItem {
  id: string;
  content: string;
  messageType: TopicMessageType;
  metadata: Record<string, unknown> | null;
  author: {
    id: string | null;
    name: string | null;
    avatar: string | null;
  };
  isCurrentUser: boolean;
  createdAt: Date;
  isEdited: boolean;
  reactions: ReactionDisplay[];
  replyTo: {
    id: string;
    content: string;
    authorName: string | null;
  } | null;
}

export interface ReactionDisplay {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
}

// =====================================================
// ACTION RESPONSE TYPES
// =====================================================

export interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

// =====================================================
// INPUT TYPES (for forms/actions)
// =====================================================

export interface CreateTopicInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility: TopicVisibility;
  writePermission: TopicWritePermission;
}

export interface UpdateTopicInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: TopicVisibility;
  writePermission?: TopicWritePermission;
  sortOrder?: number;
}

export interface SendMessageInput {
  content: string;
  replyToId?: string;
  mentions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AddMemberInput {
  userId?: string;
  email?: string;
  role: TopicMemberRole;
}

// =====================================================
// FILTER/QUERY TYPES
// =====================================================

export interface GetMessagesParams {
  limit?: number;
  before?: string; // cursor (message id)
  after?: string;
}

export interface GetTopicsParams {
  visibility?: TopicVisibility;
}

// =====================================================
// REALTIME TYPES
// =====================================================

export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: TopicMessage | null;
  old: TopicMessage | null;
}

export interface RealtimeMemberPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: TopicMember | null;
  old: TopicMember | null;
}

export interface PresenceState {
  [userId: string]: {
    isTyping: boolean;
    name: string;
    timestamp: number;
  }[];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format topic for list display
 */
export function formatTopicForList(
  topic: TopicWithUnread
): TopicListItem {
  return {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    icon: topic.icon,
    color: topic.color,
    description: topic.description,
    unreadCount: topic.unread_count,
    memberCount: topic.member_count,
    messageCount: topic.message_count,
    visibility: topic.visibility,
    writePermission: topic.write_permission,
    isDefault: topic.is_default,
    isMember: topic.is_member,
    myRole: topic.my_role,
  };
}

/**
 * Format message for chat display
 */
export function formatMessageForDisplay(
  message: TopicMessageWithAuthor,
  currentUserId: string,
  reactions: ReactionDisplay[] = []
): MessageDisplayItem {
  return {
    id: message.id,
    content: message.content,
    messageType: message.message_type,
    metadata: message.metadata,
    author: {
      id: message.author_id,
      name: message.author?.name || message.author?.email || null,
      avatar: message.author?.avatar || null,
    },
    isCurrentUser: message.author_id === currentUserId,
    createdAt: new Date(message.created_at),
    isEdited: message.is_edited,
    reactions,
    replyTo: message.reply_to
      ? {
          id: message.reply_to.id,
          content: message.reply_to.content,
          authorName: message.reply_to.author?.name || null,
        }
      : null,
  };
}

/**
 * Get time ago string (Italian)
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
    month: 'short',
  });
}

/**
 * Format message time for chat bubble
 */
export function formatMessageTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return time;
  if (isYesterday) return `Ieri ${time}`;

  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if user can write to topic based on role
 * Accepts both TopicWithUnread (snake_case) and TopicListItem (camelCase)
 */
export function canWriteToTopic(
  topic: TopicWithUnread | TopicListItem,
  userRole: 'guest' | 'authenticated' | 'verified' | 'admin'
): boolean {
  if (userRole === 'admin') return true;

  // Handle both snake_case and camelCase property names
  const writePermission = 'write_permission' in topic ? topic.write_permission : topic.writePermission;
  const isMember = 'is_member' in topic ? topic.is_member : topic.isMember;
  const myRole = 'my_role' in topic ? topic.my_role : topic.myRole;

  switch (writePermission) {
    case 'all_viewers':
      return canViewTopic(topic, userRole);
    case 'verified':
      return userRole === 'verified';
    case 'members_only':
      return isMember && myRole !== 'viewer';
    case 'admins_only':
      return myRole === 'admin';
    default:
      return false;
  }
}

/**
 * Check if user can view topic based on role
 */
export function canViewTopic(
  topic: Pick<Topic, 'visibility'>,
  userRole: 'guest' | 'authenticated' | 'verified' | 'admin'
): boolean {
  if (userRole === 'admin') return true;

  switch (topic.visibility) {
    case 'public':
      return true;
    case 'authenticated':
      return userRole !== 'guest';
    case 'verified':
      return userRole === 'verified';
    case 'members_only':
      return false; // Handled by membership check
    default:
      return false;
  }
}

/**
 * Get visibility label in Italian
 */
export function getVisibilityLabel(visibility: TopicVisibility): string {
  const labels: Record<TopicVisibility, string> = {
    public: 'Pubblico',
    authenticated: 'Utenti registrati',
    verified: 'Residenti verificati',
    members_only: 'Solo membri',
  };
  return labels[visibility];
}

/**
 * Get write permission label in Italian
 */
export function getWritePermissionLabel(permission: TopicWritePermission): string {
  const labels: Record<TopicWritePermission, string> = {
    all_viewers: 'Tutti possono scrivere',
    verified: 'Solo verificati',
    members_only: 'Solo membri',
    admins_only: 'Solo admin',
  };
  return labels[permission];
}

/**
 * Get member role label in Italian
 */
export function getMemberRoleLabel(role: TopicMemberRole): string {
  const labels: Record<TopicMemberRole, string> = {
    viewer: 'Lettore',
    writer: 'Membro',
    moderator: 'Moderatore',
    admin: 'Amministratore',
  };
  return labels[role];
}

/**
 * Available emoji reactions
 */
export const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const;
export type AvailableReaction = (typeof AVAILABLE_REACTIONS)[number];
/**
 * Format voice message duration (seconds to mm:ss)
 */
export function formatVoiceDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if metadata contains voice message data
 */
export function isVoiceMessage(metadata: Record<string, unknown> | null): metadata is { url: string; voice: VoiceMessageMetadata } {
  return metadata !== null && 'voice' in metadata && typeof metadata.voice === 'object' && 'url' in metadata;
}

/**
 * Check if metadata contains images (supports both new and legacy format)
 */
export function hasImages(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false;
  // New format: images array
  if (Array.isArray(metadata.images) && metadata.images.length > 0) return true;
  // Legacy format: single url
  if (typeof metadata.url === 'string' && metadata.url.length > 0 && !('voice' in metadata)) return true;
  return false;
}

/**
 * Get normalized images array from metadata (handles both new and legacy format)
 */
export function getImagesFromMetadata(metadata: Record<string, unknown> | null): ImageAttachment[] {
  if (!metadata) return [];

  // New format: return images array as-is
  if (Array.isArray(metadata.images)) {
    return metadata.images as ImageAttachment[];
  }

  // Legacy format: convert single image to array (skip if voice message)
  if (typeof metadata.url === 'string' && !('voice' in metadata)) {
    return [{
      url: metadata.url,
      width: typeof metadata.width === 'number' ? metadata.width : undefined,
      height: typeof metadata.height === 'number' ? metadata.height : undefined,
    }];
  }

  return [];
}
