'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  ShoppingBag,
  Megaphone,
  Bell,
  ChevronRight,
} from 'lucide-react';
import type { UserNotification, NotificationType } from '@/types/notifications';

interface NotificationItemProps {
  notification: UserNotification;
  onClick?: () => void;
}

/**
 * Configuration for each notification type
 * Defines icon, colors for visual distinction
 */
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  user_registration: {
    icon: UserPlus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  user_approved: {
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  user_rejected: {
    icon: UserX,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  proposal_new: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  proposal_status: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  event_reminder: {
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  marketplace_new: {
    icon: ShoppingBag,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  announcement: {
    icon: Megaphone,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  system: {
    icon: Bell,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};

/**
 * Single notification item component
 * Displays notification content with type-specific styling
 */
export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
  const Icon = config.icon;

  const isUnread =
    notification.status === 'unread' || notification.status === 'action_pending';
  const isActionPending = notification.status === 'action_pending';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left transition-colors',
        'hover:bg-slate-50 border-b border-slate-100',
        isUnread && 'bg-blue-50/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              isUnread
                ? 'font-semibold text-slate-900'
                : 'font-medium text-slate-700'
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"
              aria-hidden="true"
            />
          )}
        </div>

        {notification.message && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: it,
            })}
          </span>
          {isActionPending && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Azione richiesta
            </Badge>
          )}
        </div>
      </div>

      {/* Arrow indicator for clickable items */}
      {notification.action_url && (
        <ChevronRight className="flex-shrink-0 h-5 w-5 text-slate-400 self-center" />
      )}
    </button>
  );
}
