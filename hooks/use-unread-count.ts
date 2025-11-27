'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseUnreadCountOptions {
  userId: string | null;
  enabled?: boolean;
  onUnreadChange?: (count: number) => void;
}

interface UseUnreadCountReturn {
  totalUnread: number;
  topicUnreads: Map<string, number>;
  isConnected: boolean;
  refreshUnreadCount: () => Promise<void>;
  markTopicAsRead: (topicId: string) => void;
}

/**
 * Hook for tracking global unread message count across all topics
 * Used for the notification badge in the header
 */
export function useUnreadCount({
  userId,
  enabled = true,
  onUnreadChange,
}: UseUnreadCountOptions): UseUnreadCountReturn {
  const [totalUnread, setTotalUnread] = useState(0);
  const [topicUnreads, setTopicUnreads] = useState<Map<string, number>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch initial unread counts
  const refreshUnreadCount = useCallback(async () => {
    if (!userId) return;

    const supabase = supabaseRef.current;

    // Verify session is active before querying
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // No active session - silently return (not an error)
      return;
    }

    // Get unread counts from topic_members
    const { data, error } = await supabase
      .from('topic_members')
      .select('topic_id, unread_count')
      .eq('user_id', userId)
      .eq('is_muted', false)
      .gt('unread_count', 0);

    if (error) {
      // Silent fail - unread counts are non-critical UI feature
      // Errors here are typically:
      // - Session expired/invalid (returns {} with non-enumerable properties)
      // - RLS policy blocks (user not member of any topic)
      // - Network issues
      // All these cases: just don't show unread counts, no need to log
      return;
    }

    const unreadsMap = new Map<string, number>();
    let total = 0;

    (data || []).forEach((item) => {
      unreadsMap.set(item.topic_id, item.unread_count);
      total += item.unread_count;
    });

    setTopicUnreads(unreadsMap);
    setTotalUnread(total);
    onUnreadChange?.(total);
  }, [userId, onUnreadChange]);

  // Mark a topic as read locally
  const markTopicAsRead = useCallback((topicId: string) => {
    setTopicUnreads((prev) => {
      const updated = new Map(prev);
      const oldCount = updated.get(topicId) || 0;
      updated.delete(topicId);

      // Update total
      setTotalUnread((prevTotal) => {
        const newTotal = Math.max(0, prevTotal - oldCount);
        onUnreadChange?.(newTotal);
        return newTotal;
      });

      return updated;
    });
  }, [onUnreadChange]);

  // Subscribe to realtime updates for topic_members changes
  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = supabaseRef.current;

    // Initial fetch
    refreshUnreadCount();

    // Subscribe to changes in topic_members for this user
    const channel = supabase
      .channel(`unread-counts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'topic_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as {
            topic_id: string;
            unread_count: number;
            is_muted: boolean;
          };

          setTopicUnreads((prev) => {
            const updated = new Map(prev);

            if (newData.is_muted || newData.unread_count === 0) {
              updated.delete(newData.topic_id);
            } else {
              updated.set(newData.topic_id, newData.unread_count);
            }

            // Recalculate total
            let total = 0;
            updated.forEach((count) => {
              total += count;
            });
            setTotalUnread(total);
            onUnreadChange?.(total);

            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topic_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as {
            topic_id: string;
            unread_count: number;
            is_muted: boolean;
          };

          if (!newData.is_muted && newData.unread_count > 0) {
            setTopicUnreads((prev) => {
              const updated = new Map(prev);
              updated.set(newData.topic_id, newData.unread_count);

              let total = 0;
              updated.forEach((count) => {
                total += count;
              });
              setTotalUnread(total);
              onUnreadChange?.(total);

              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'topic_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldData = payload.old as { topic_id: string };

          setTopicUnreads((prev) => {
            const updated = new Map(prev);
            updated.delete(oldData.topic_id);

            let total = 0;
            updated.forEach((count) => {
              total += count;
            });
            setTotalUnread(total);
            onUnreadChange?.(total);

            return updated;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, refreshUnreadCount, onUnreadChange]);

  return {
    totalUnread,
    topicUnreads,
    isConnected,
    refreshUnreadCount,
    markTopicAsRead,
  };
}
