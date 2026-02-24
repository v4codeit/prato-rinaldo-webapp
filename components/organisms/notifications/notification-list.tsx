'use client';

import * as React from 'react';
import { NotificationItem } from './notification-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';
import type { UserNotification } from '@/types/notifications';

interface NotificationListProps {
  notifications: UserNotification[];
  onNotificationClick: (notification: UserNotification) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Scrollable list of notifications
 * Handles loading state and empty state
 */
export function NotificationList({
  notifications,
  onNotificationClick,
  isLoading,
  emptyMessage = 'Nessuna notifica',
}: NotificationListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  // Notification list
  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={() => onNotificationClick(notification)}
        />
      ))}
    </div>
  );
}
