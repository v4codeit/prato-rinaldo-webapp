'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/app/actions/notifications';
import { UserNotification } from '@/types/notifications';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsResult, countResult] = await Promise.all([
        getNotifications(50),
        getUnreadNotificationCount()
      ]);

      if (notifsResult.notifications) {
        setNotifications(notifsResult.notifications);
      }

      if (typeof countResult.count === 'number') {
        setUnreadCount(countResult.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
        },
        (payload) => {
          // Refresh on any change
          fetchNotifications();

          // Show toast for new INSERTs
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as UserNotification;
            toast.info(newNotif.title, {
              description: newNotif.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: n.status === 'action_pending' ? 'action_pending' : 'read' } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    await markNotificationAsRead(id);
    fetchNotifications(); // Re-fetch to ensure sync
  };

  const markAllRead = async () => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({ ...n, status: n.status === 'action_pending' ? 'action_pending' : 'read' }))
    );
    setUnreadCount(0);

    await markAllNotificationsAsRead();
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications
  };
}
