'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresenceState, TypingUser } from '@/types/topics';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseTypingIndicatorOptions {
  topicId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  setTyping: (isTyping: boolean) => void;
  isConnected: boolean;
}

// Typing timeout - stop showing after 3 seconds of no typing
const TYPING_TIMEOUT = 3000;
// Debounce delay for typing events
const TYPING_DEBOUNCE = 500;

/**
 * Hook for managing typing indicators using Supabase Presence
 */
export function useTypingIndicator({
  topicId,
  userId,
  userName,
  enabled = true,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);
  const supabaseRef = useRef(createClient());

  // Calculate typing users from presence state
  const typingUsers = useMemo(() => {
    const now = Date.now();
    const users: TypingUser[] = [];

    Object.entries(presenceState).forEach(([id, presences]) => {
      if (id === `user:${userId}`) return; // Skip current user

      const latestPresence = presences[presences.length - 1];
      if (
        latestPresence?.isTyping &&
        now - latestPresence.timestamp < TYPING_TIMEOUT
      ) {
        users.push({
          id: id.replace('user:', ''),
          name: latestPresence.name,
        });
      }
    });

    return users;
  }, [presenceState, userId]);

  // Track and send typing state
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !enabled) return;

      const now = Date.now();

      // Debounce typing events
      if (isTyping && now - lastTypingRef.current < TYPING_DEBOUNCE) {
        return;
      }

      lastTypingRef.current = now;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Track presence
      channelRef.current.track({
        isTyping,
        name: userName,
        timestamp: now,
      });

      // Auto-stop typing after timeout
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            isTyping: false,
            name: userName,
            timestamp: Date.now(),
          });
        }, TYPING_TIMEOUT);
      }
    },
    [enabled, userName]
  );

  // Subscribe to presence channel
  useEffect(() => {
    if (!enabled || !topicId || !userId) return;

    const supabase = supabaseRef.current;

    // Create presence channel for this topic
    const channel = supabase
      .channel(`topic-presence:${topicId}`, {
        config: {
          presence: {
            key: `user:${userId}`,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{
          isTyping: boolean;
          name: string;
          timestamp: number;
        }>();
        setPresenceState(state as PresenceState);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setPresenceState((prev) => {
          const updated = { ...prev };
          newPresences.forEach((presence) => {
            const key = presence.presence_ref;
            if (key) {
              updated[key] = [...(updated[key] || []), presence as any];
            }
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setPresenceState((prev) => {
          const updated = { ...prev };
          leftPresences.forEach((presence) => {
            const key = presence.presence_ref;
            if (key && updated[key]) {
              updated[key] = updated[key].filter(
                (p) => p.timestamp !== (presence as any).timestamp
              );
              if (updated[key].length === 0) {
                delete updated[key];
              }
            }
          });
          return updated;
        });
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          // Track initial presence (not typing)
          channel.track({
            isTyping: false,
            name: userName,
            timestamp: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [topicId, userId, userName, enabled]);

  return {
    typingUsers,
    setTyping,
    isConnected,
  };
}
