'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  TopicMessageWithAuthor,
  RealtimeMessagePayload,
} from '@/types/topics';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseTopicMessagesOptions {
  topicId: string;
  enabled?: boolean;
  onNewMessage?: (message: TopicMessageWithAuthor) => void;
  onMessageUpdate?: (message: TopicMessageWithAuthor) => void;
  onMessageDelete?: (messageId: string) => void;
}

interface UseTopicMessagesReturn {
  messages: TopicMessageWithAuthor[];
  setMessages: React.Dispatch<React.SetStateAction<TopicMessageWithAuthor[]>>;
  isConnected: boolean;
  addOptimisticMessage: (message: TopicMessageWithAuthor) => void;
  updateOptimisticMessage: (tempId: string, realMessage: TopicMessageWithAuthor) => void;
  removeOptimisticMessage: (tempId: string) => void;
}

/**
 * Hook for subscribing to real-time topic messages
 * Uses Supabase Realtime Postgres Changes
 */
export function useTopicMessages({
  topicId,
  enabled = true,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
}: UseTopicMessagesOptions): UseTopicMessagesReturn {
  const [messages, setMessages] = useState<TopicMessageWithAuthor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch author data for a message
  const fetchAuthorData = useCallback(async (authorId: string | null) => {
    if (!authorId) return null;

    const { data } = await supabaseRef.current
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', authorId)
      .single();

    return data;
  }, []);

  // Fetch reply data for a message
  const fetchReplyData = useCallback(async (replyToId: string | null) => {
    if (!replyToId) return null;

    const { data } = await supabaseRef.current
      .from('topic_messages')
      .select(`
        id, content, author_id,
        author:users!author_id(id, name, email, avatar)
      `)
      .eq('id', replyToId)
      .single();

    return data as TopicMessageWithAuthor | null;
  }, []);

  // Handle incoming message events
  const handleMessageChange = useCallback(
    async (payload: RealtimeMessagePayload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newMessage = payload.new;
        console.log('[useTopicMessages] INSERT event received:', newMessage.id, 'reply_to_id:', newMessage.reply_to_id);

        // Fetch author and reply data
        const [author, replyTo] = await Promise.all([
          fetchAuthorData(newMessage.author_id),
          fetchReplyData(newMessage.reply_to_id),
        ]);

        console.log('[useTopicMessages] Enriched INSERT with author:', author?.name, 'reply_to:', replyTo?.id, replyTo?.content?.substring(0, 30));

        const enrichedMessage: TopicMessageWithAuthor = {
          ...newMessage,
          author,
          reply_to: replyTo,
        };

        setMessages((prev) => {
          // Check if message already exists (optimistic update)
          const exists = prev.some((m) => m.id === enrichedMessage.id);
          if (exists) {
            console.log('[useTopicMessages] Message already exists (optimistic), skipping');
            return prev;
          }
          return [...prev, enrichedMessage];
        });

        onNewMessage?.(enrichedMessage);
      }

      if (payload.eventType === 'UPDATE' && payload.new) {
        const updatedMessage = payload.new;
        console.log('[useTopicMessages] UPDATE event received:', updatedMessage.id);

        // FIX: Fetch author and replyTo data BEFORE updating state
        // to preserve nested relations that aren't in the UPDATE payload
        const [author, replyTo] = await Promise.all([
          fetchAuthorData(updatedMessage.author_id),
          fetchReplyData(updatedMessage.reply_to_id),
        ]);

        console.log('[useTopicMessages] Enriched UPDATE with author:', author?.name, 'reply_to:', replyTo?.id);

        // Build enriched message with all data
        const enrichedMessage: TopicMessageWithAuthor = {
          ...updatedMessage,
          author,
          reply_to: replyTo,
        };

        // Update state with enriched message (preserves reply_to and author)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === enrichedMessage.id ? enrichedMessage : m
          )
        );

        onMessageUpdate?.(enrichedMessage);
      }

      if (payload.eventType === 'DELETE' && payload.old) {
        const deletedId = payload.old.id;
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        onMessageDelete?.(deletedId);
      }
    },
    [fetchAuthorData, fetchReplyData, onNewMessage, onMessageUpdate, onMessageDelete]
  );

  // Subscribe to realtime channel
  useEffect(() => {
    if (!enabled || !topicId) return;

    const supabase = supabaseRef.current;

    // Create channel for this topic
    const channel = supabase
      .channel(`topic-messages:${topicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_messages',
          filter: `topic_id=eq.${topicId}`,
        },
        (payload) => {
          handleMessageChange(payload as unknown as RealtimeMessagePayload);
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
  }, [topicId, enabled, handleMessageChange]);

  // Optimistic update helpers
  const addOptimisticMessage = useCallback((message: TopicMessageWithAuthor) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateOptimisticMessage = useCallback(
    (tempId: string, realMessage: TopicMessageWithAuthor) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? realMessage : m))
      );
    },
    []
  );

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  return {
    messages,
    setMessages,
    isConnected,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage,
  };
}
