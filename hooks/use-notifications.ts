'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  UserNotification,
  UseNotificationsOptions,
  UseNotificationsReturn,
} from '@/types/notifications';

/**
 * Hook for managing in-app notifications with real-time updates
 *
 * Features:
 * - Fetches notifications from database
 * - Real-time subscription for new notifications and updates
 * - Optimistic updates for mark as read operations
 * - Unread count calculation
 *
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   isLoading,
 *   markAsRead,
 *   markAllAsRead,
 * } = useNotifications({
 *   userId: user?.id || null,
 *   enabled: !!user,
 * });
 * ```
 */
export function useNotifications({
  userId,
  enabled = true,
  limit = 50,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Calculate unread count from notifications
  const unreadCount = useMemo(() => {
    return notifications.filter(
      (n) => n.status === 'unread' || n.status === 'action_pending'
    ).length;
  }, [notifications]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = supabaseRef.current;

    // Verify session is active
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      setNotifications((data as UserNotification[]) || []);
    } catch (err) {
      console.error('[useNotifications] Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento notifiche');
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled, limit]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const supabase = supabaseRef.current;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.status === 'unread'
          ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
          : n
      )
    );

    try {
      const { error: updateError } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      // Revert on error
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const supabase = supabaseRef.current;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === 'unread'
          ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
          : n
      )
    );

    try {
      const { error: updateError } = await supabase
        .from('user_notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'unread');

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      await fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Mark action as completed
  const markActionCompleted = useCallback(async (notificationId: string) => {
    const supabase = supabaseRef.current;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.requires_action
          ? {
              ...n,
              status: 'action_completed' as const,
              action_completed_at: new Date().toISOString(),
              read_at: n.read_at || new Date().toISOString(),
            }
          : n
      )
    );

    try {
      const { error: updateError } = await supabase.rpc(
        'mark_notification_action_completed',
        {
          p_notification_id: notificationId,
          p_related_id: null,
        }
      );

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('[useNotifications] Error marking action completed:', err);
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = supabaseRef.current;

    // Initial fetch
    fetchNotifications();

    // Subscribe to changes in user_notifications for this user
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<UserNotification>) => {
          console.log('[useNotifications] New notification received:', payload);
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const newNotification = payload.new as UserNotification;
            setNotifications((prev) => {
              // Avoid duplicates
              if (prev.some((n) => n.id === newNotification.id)) {
                return prev;
              }
              return [newNotification, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<UserNotification>) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const updatedNotification = payload.new as UserNotification;
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<UserNotification>) => {
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            const deletedId = (payload.old as { id: string }).id;
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('[useNotifications] Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    markAsRead,
    markAllAsRead,
    markActionCompleted,
    refetch: fetchNotifications,
  };
}
