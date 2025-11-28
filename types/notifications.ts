/**
 * Type definitions for the In-App Notification System
 * Import these types in your components
 *
 * @see docs/NOTIFICATION_SYSTEM_PLAN.md for full documentation
 */

// =====================================================
// ENUM TYPES (matching database ENUMs)
// =====================================================

/**
 * Notification types - defines the category of notification
 * Used for filtering, icons, and routing logic
 */
export type NotificationType =
  | 'user_registration'    // Nuovo utente registrato (richiede azione admin)
  | 'user_approved'        // Utente approvato (info)
  | 'user_rejected'        // Utente rifiutato (info)
  | 'proposal_new'         // Nuova proposta Agorà
  | 'proposal_status'      // Cambio stato proposta
  | 'event_reminder'       // Reminder evento
  | 'marketplace_new'      // Nuovo annuncio marketplace
  | 'announcement'         // Annuncio admin
  | 'system';              // Notifica di sistema

/**
 * Notification status - defines the current state of a notification
 */
export type NotificationStatus =
  | 'unread'               // Non letta
  | 'read'                 // Letta
  | 'action_pending'       // Richiede azione (non completata)
  | 'action_completed'     // Azione completata
  | 'archived';            // Archiviata

// =====================================================
// BASE INTERFACES (matching database tables)
// =====================================================

/**
 * User notification record from database
 * Maps directly to `user_notifications` table
 */
export interface UserNotification {
  id: string;
  tenant_id: string;
  user_id: string;

  // Notification content
  type: NotificationType;
  title: string;
  message: string | null;

  // Related entity (polymorphic reference)
  related_type: string | null;       // 'user', 'proposal', 'event', etc.
  related_id: string | null;         // UUID of related entity

  // Navigation
  action_url: string | null;         // Where to navigate on click

  // Metadata (flexible JSON for type-specific data)
  metadata: NotificationMetadata;

  // Status tracking
  status: NotificationStatus;
  requires_action: boolean;

  // Timestamps
  created_at: string;
  read_at: string | null;
  action_completed_at: string | null;
}

// =====================================================
// METADATA INTERFACES (type-specific)
// =====================================================

/**
 * Base metadata interface - all notifications have this
 */
export interface BaseNotificationMetadata {
  [key: string]: unknown;
}

/**
 * User registration notification metadata
 */
export interface UserRegistrationMetadata extends BaseNotificationMetadata {
  new_user_id: string;
  new_user_name: string | null;
  new_user_email: string | null;
  registered_at: string;
}

/**
 * Proposal notification metadata
 */
export interface ProposalNotificationMetadata extends BaseNotificationMetadata {
  proposal_id: string;
  proposal_title: string;
  proposal_status?: string;
  author_name?: string;
}

/**
 * Event notification metadata
 */
export interface EventNotificationMetadata extends BaseNotificationMetadata {
  event_id: string;
  event_title: string;
  event_date: string;
  event_location?: string;
}

/**
 * Marketplace notification metadata
 */
export interface MarketplaceNotificationMetadata extends BaseNotificationMetadata {
  item_id: string;
  item_title: string;
  item_price?: number;
  seller_name?: string;
}

/**
 * Union type for all metadata types
 */
export type NotificationMetadata =
  | BaseNotificationMetadata
  | UserRegistrationMetadata
  | ProposalNotificationMetadata
  | EventNotificationMetadata
  | MarketplaceNotificationMetadata;

// =====================================================
// UI/COMPONENT INTERFACES
// =====================================================

/**
 * Props for NotificationBell component
 */
export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

/**
 * Props for NotificationDrawer component
 */
export interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Props for NotificationItem component
 */
export interface NotificationItemProps {
  notification: UserNotification;
  onClick?: () => void;
}

/**
 * Props for NotificationList component
 */
export interface NotificationListProps {
  notifications: UserNotification[];
  onNotificationClick: (notification: UserNotification) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

// =====================================================
// HOOK INTERFACES
// =====================================================

/**
 * Options for useNotifications hook
 */
export interface UseNotificationsOptions {
  userId: string | null;
  enabled?: boolean;
  limit?: number;
}

/**
 * Return type for useNotifications hook
 */
export interface UseNotificationsReturn {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markActionCompleted: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// =====================================================
// SERVER ACTION INTERFACES
// =====================================================

/**
 * Input for creating a notification
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  requiresAction?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Response from notification actions
 */
export interface NotificationActionResponse {
  success?: boolean;
  error?: string;
  notifications?: UserNotification[];
  count?: number;
}

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Check if notification requires action
 */
export function isActionRequired(notification: UserNotification): boolean {
  return notification.requires_action && notification.status === 'action_pending';
}

/**
 * Check if notification is unread
 */
export function isUnread(notification: UserNotification): boolean {
  return notification.status === 'unread' || notification.status === 'action_pending';
}

/**
 * Check if metadata is for user registration
 */
export function isUserRegistrationMetadata(
  metadata: NotificationMetadata
): metadata is UserRegistrationMetadata {
  return 'new_user_id' in metadata;
}

// =====================================================
// CONSTANTS (for UI)
// =====================================================

/**
 * Notification type configuration for UI display
 */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    label: string;
    icon: string;        // Lucide icon name
    color: string;       // Tailwind color class
    bgColor: string;     // Tailwind background color class
  }
> = {
  user_registration: {
    label: 'Registrazione utente',
    icon: 'UserPlus',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  user_approved: {
    label: 'Utente approvato',
    icon: 'UserCheck',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  user_rejected: {
    label: 'Utente rifiutato',
    icon: 'UserX',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  proposal_new: {
    label: 'Nuova proposta',
    icon: 'FileText',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  proposal_status: {
    label: 'Aggiornamento proposta',
    icon: 'FileText',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  event_reminder: {
    label: 'Promemoria evento',
    icon: 'Calendar',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  marketplace_new: {
    label: 'Nuovo annuncio',
    icon: 'ShoppingBag',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  announcement: {
    label: 'Annuncio',
    icon: 'Megaphone',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  system: {
    label: 'Sistema',
    icon: 'Bell',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};
