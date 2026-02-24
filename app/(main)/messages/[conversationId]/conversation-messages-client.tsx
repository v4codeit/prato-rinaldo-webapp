'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageBubble } from '@/components/molecules/message-bubble';
import { devLog } from '@/lib/utils/dev-log';

interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender: MessageSender;
}

interface ConversationMessagesClientProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function ConversationMessagesClient({
  conversationId,
  currentUserId,
  initialMessages,
}: ConversationMessagesClientProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);

  // Scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom on first render
  React.useEffect(() => {
    if (isFirstRender.current) {
      scrollToBottom();
      isFirstRender.current = false;
    }
  }, [scrollToBottom]);

  // Supabase Realtime subscription
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          devLog(
            'ConversationMessages',
            'New message received:',
            payload.new.id
          );

          const newMsg = payload.new as Record<string, unknown>;

          // Fetch sender info separately (PostgREST limitation with realtime payloads)
          const { data: sender } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', newMsg.sender_id as string)
            .single();

          const message: Message = {
            id: newMsg.id as string,
            conversation_id: newMsg.conversation_id as string,
            sender_id: newMsg.sender_id as string,
            content: newMsg.content as string,
            is_read: newMsg.is_read as boolean,
            created_at: newMsg.created_at as string,
            updated_at: newMsg.updated_at as string,
            sender: sender
              ? { id: sender.id, name: sender.name || 'Utente', avatar: sender.avatar }
              : { id: newMsg.sender_id as string, name: 'Utente', avatar: null },
          };

          setMessages((prev) => {
            // Avoid duplicates (e.g., from optimistic updates or double events)
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });

          // Scroll to bottom for new messages
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe((status) => {
        devLog('ConversationMessages', 'Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, scrollToBottom]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="container max-w-4xl py-6">
        {messages.length > 0 ? (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                senderName={message.sender.name}
                senderAvatar={message.sender.avatar}
                timestamp={message.created_at}
                isMine={message.sender_id === currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nessun messaggio ancora. Inizia la conversazione!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
