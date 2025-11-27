'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Reaction {
  messageId: string;
  emoji: string;
  userId: string;
}

interface UseTopicReactionsOptions {
  topicId: string;
  enabled?: boolean;
  onReactionAdd?: (reaction: Reaction) => void;
  onReactionRemove?: (reaction: Reaction) => void;
}

interface UseTopicReactionsReturn {
  isConnected: boolean;
}

/**
 * Hook for subscribing to real-time reaction changes
 * Updates are propagated via callbacks to update message state
 */
export function useTopicReactions({
  topicId,
  enabled = true,
  onReactionAdd,
  onReactionRemove,
}: UseTopicReactionsOptions): UseTopicReactionsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Handle reaction changes
  // NOTE: DELETE events are IGNORED because with RLS enabled, Supabase only sends
  // the primary key in payload.old (not message_id, emoji, user_id).
  // The optimistic update in topic-chat.tsx handles UI removal.
  // See: https://github.com/orgs/supabase/discussions/12471
  const handleReactionChange = useCallback(
    (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: { message_id: string; emoji: string; user_id: string } | null;
      old: { message_id: string; emoji: string; user_id: string } | null;
    }) => {
      // INSERT: New reaction added
      if (payload.eventType === 'INSERT' && payload.new) {
        onReactionAdd?.({
          messageId: payload.new.message_id,
          emoji: payload.new.emoji,
          userId: payload.new.user_id,
        });
      }

      // UPDATE: Emoji changed (e.g., from 👍 to ❤️)
      // Server does UPDATE when user changes emoji (not DELETE+INSERT)
      if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
        // Remove old emoji (only if we have valid data)
        if (payload.old.message_id && payload.old.emoji && payload.old.user_id) {
          onReactionRemove?.({
            messageId: payload.old.message_id,
            emoji: payload.old.emoji,
            userId: payload.old.user_id,
          });
        }
        // Add new emoji
        onReactionAdd?.({
          messageId: payload.new.message_id,
          emoji: payload.new.emoji,
          userId: payload.new.user_id,
        });
      }

      // DELETE: IGNORED!
      // With RLS enabled, payload.old only contains primary key (id),
      // not message_id/emoji/user_id needed for state update.
      // The optimistic update in topic-chat.tsx handles UI removal.
      // On page refresh, correct data is loaded from server.
    },
    [onReactionAdd, onReactionRemove]
  );

  // Subscribe to reactions for messages in this topic
  useEffect(() => {
    if (!enabled || !topicId) return;

    const supabase = supabaseRef.current;

    // Note: We can't filter by topic_id directly on topic_message_reactions
    // because it doesn't have that column. We subscribe to all reactions
    // and filter client-side, or use a view/function to get topic-filtered reactions.
    // For now, we'll fetch message IDs for this topic and filter.

    const channel = supabase
      .channel(`topic-reactions:${topicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_message_reactions',
        },
        async (payload) => {
          const reactionData = payload.new || payload.old;
          if (!reactionData) return;

          // Verify this reaction belongs to a message in our topic
          const { data: message } = await supabase
            .from('topic_messages')
            .select('topic_id')
            .eq('id', (reactionData as any).message_id)
            .single();

          if (message?.topic_id === topicId) {
            handleReactionChange(payload as any);
          }
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
  }, [topicId, enabled, handleReactionChange]);

  return {
    isConnected,
  };
}
