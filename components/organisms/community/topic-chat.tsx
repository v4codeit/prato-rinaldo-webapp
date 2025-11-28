'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatHeader } from './chat-header';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { TopicInfoSheet } from './topic-info-sheet';
import { EmptyState } from '@/components/molecules/empty-state';
import { useTopicMessages } from '@/hooks/use-topic-messages';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { useTopicReactions } from '@/hooks/use-topic-reactions';
import {
  getTopicMessages,
  sendTopicMessage,
  editTopicMessage,
  deleteTopicMessage,
  toggleReaction,
  markTopicAsRead,
  uploadTopicImage,
  sendVoiceMessage,
} from '@/app/actions/topic-messages';
import { getTopicMembers } from '@/app/actions/topic-members';
import { leaveTopic, toggleTopicMute } from '@/app/actions/topic-members';
import type {
  TopicListItem,
  TopicMessageWithAuthor,
  TopicMemberWithUser,
  MessageDisplayItem,
  VoiceMessageMetadata,
} from '@/types/topics';
import { formatMessageForDisplay } from '@/types/topics';
import { MessageSquare, ChevronDown, Loader2 } from 'lucide-react';

// Available topic backgrounds (SVG patterns)
const TOPIC_BACKGROUNDS = [
  '/assets/svg/topics/backgrounds/14546365_rm183-kul-02.svg',
  '/assets/svg/topics/backgrounds/16294906_449.svg',
  '/assets/svg/topics/backgrounds/173011720_1eeac0b5-66bb-440e-a4fd-4abbb87e9f9e.svg',
  '/assets/svg/topics/backgrounds/212755287_c4332502-c132-441d-8dcd-8905c80bfdef.svg',
  '/assets/svg/topics/backgrounds/212769313_a9ca7608-f4c6-4567-84bd-c36a3fe19916.svg',
  '/assets/svg/topics/backgrounds/212769349_e39aa291-9257-402f-acab-3a85b123abce.svg',
  '/assets/svg/topics/backgrounds/32374768_013431677721.svg',
  '/assets/svg/topics/backgrounds/415666873_ff96e824-571e-49a3-ae5b-5bf5cf40c779.svg',
] as const;

/**
 * Get deterministic background for a topic based on its ID
 * Same topic always gets the same background
 */
function getTopicBackground(topicId: string): string {
  const hash = topicId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TOPIC_BACKGROUNDS[hash % TOPIC_BACKGROUNDS.length];
}

interface TopicChatProps {
  topic: TopicListItem;
  initialMessages: TopicMessageWithAuthor[];
  currentUserId: string;
  currentUserName: string;
  canWrite: boolean;
  showBackButton?: boolean;
  className?: string;
}

/**
 * TopicChat - Main chat view component combining all chat elements
 */
export function TopicChat({
  topic,
  initialMessages,
  currentUserId,
  currentUserName,
  canWrite,
  showBackButton = false,
  className,
}: TopicChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showInfoSheet, setShowInfoSheet] = React.useState(false);
  const [members, setMembers] = React.useState<TopicMemberWithUser[]>([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [replyTo, setReplyTo] = React.useState<{
    id: string;
    content: string;
    authorName: string | null;
  } | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [newMessageCount, setNewMessageCount] = React.useState(0);
  const isNearBottomRef = React.useRef(true);

  // Scroll to bottom - defined BEFORE hooks that use it
  // FIX 9b.1: Use viewport selector for Radix ScrollArea (Root element isn't scrollable)
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (scrollRef.current) {
      // ScrollArea di Radix UI: il Viewport è il figlio con data-radix-scroll-area-viewport
      const viewport = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
      // Reset new message count when scrolling to bottom
      setNewMessageCount(0);
    }
  }, []);

  // Memoized callback for new messages - STABLE REFERENCE
  // Only auto-scroll if user is near bottom, otherwise increment counter
  const handleNewMessage = React.useCallback(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    } else {
      setNewMessageCount((prev) => prev + 1);
    }
  }, [scrollToBottom]);

  // Realtime messages hook
  const {
    messages,
    setMessages,
    isConnected,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage,
  } = useTopicMessages({
    topicId: topic.id,
    onNewMessage: handleNewMessage, // ✅ Stable reference
  });

  // Typing indicator hook
  const { typingUsers, setTyping } = useTypingIndicator({
    topicId: topic.id,
    userId: currentUserId,
    userName: currentUserName,
  });

  // Reactions state (separate from messages since reactions are in a separate table)
  const [messageReactions, setMessageReactions] = React.useState<
    Record<string, Record<string, string[]>>
  >({});

  // Memoized callback for reaction add - STABLE REFERENCE
  const handleRealtimeReactionAdd = React.useCallback((reaction: {
    messageId: string;
    emoji: string;
    userId: string;
  }) => {
    setMessageReactions((prev) => {
      const msgReactions = { ...(prev[reaction.messageId] || {}) };
      if (!msgReactions[reaction.emoji]) {
        msgReactions[reaction.emoji] = [];
      }
      if (!msgReactions[reaction.emoji].includes(reaction.userId)) {
        msgReactions[reaction.emoji] = [...msgReactions[reaction.emoji], reaction.userId];
      }
      return { ...prev, [reaction.messageId]: msgReactions };
    });
  }, []); // setMessageReactions is stable from useState

  // Memoized callback for reaction remove - STABLE REFERENCE
  const handleRealtimeReactionRemove = React.useCallback((reaction: {
    messageId: string;
    emoji: string;
    userId: string;
  }) => {
    setMessageReactions((prev) => {
      const msgReactions = { ...(prev[reaction.messageId] || {}) };
      if (msgReactions[reaction.emoji]) {
        msgReactions[reaction.emoji] = msgReactions[reaction.emoji].filter(
          (id: string) => id !== reaction.userId
        );
        if (msgReactions[reaction.emoji].length === 0) {
          delete msgReactions[reaction.emoji];
        }
      }
      return { ...prev, [reaction.messageId]: msgReactions };
    });
  }, []); // setMessageReactions is stable from useState

  // Reactions hook - using stable callbacks
  useTopicReactions({
    topicId: topic.id,
    onReactionAdd: handleRealtimeReactionAdd,    // ✅ Stable reference
    onReactionRemove: handleRealtimeReactionRemove, // ✅ Stable reference
  });

  // Initialize messages and reactions from server data
  React.useEffect(() => {
    setMessages(initialMessages);
    setHasMoreMessages(initialMessages.length >= 50);

    // Populate messageReactions state from server data (message_reactions field)
    const initialReactions: Record<string, Record<string, string[]>> = {};
    for (const msg of initialMessages) {
      if (msg.message_reactions && msg.message_reactions.length > 0) {
        const msgReactions: Record<string, string[]> = {};
        for (const r of msg.message_reactions) {
          if (!msgReactions[r.emoji]) {
            msgReactions[r.emoji] = [];
          }
          msgReactions[r.emoji].push(r.user_id);
        }
        initialReactions[msg.id] = msgReactions;
      }
    }
    setMessageReactions(initialReactions);

    // Mark as read when entering
    markTopicAsRead(topic.id);

    // FIX 9b.1: Scroll to bottom after messages load (instant, not smooth)
    // Small delay to allow DOM to render
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [initialMessages, setMessages, topic.id, scrollToBottom]);

  // Format messages for display with reactions
  const displayMessages: MessageDisplayItem[] = React.useMemo(() => {
    return messages.map((m) => {
      // Build reactions array from messageReactions state
      const reactionsObj = messageReactions[m.id] || {};
      const reactions = Object.entries(reactionsObj).map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        userIds,
        hasReacted: userIds.includes(currentUserId),
      }));
      return formatMessageForDisplay(m, currentUserId, reactions);
    });
  }, [messages, currentUserId, messageReactions]);

  // Handle scroll to detect if at bottom
  // FIX 9b.1: Use viewport selector for accurate scroll detection
  const handleScroll = React.useCallback(() => {
    // Get the actual scrollable viewport from ScrollArea
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLElement | null;
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isAtBottom);
    isNearBottomRef.current = isAtBottom;

    // Reset new message count when scrolling to bottom
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, []);

  // Load more messages (older)
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessageId = messages[0].id;

    const result = await getTopicMessages(topic.id, {
      before: oldestMessageId,
      limit: 50,
    });

    if (result.data) {
      setMessages((prev) => [...result.data!.data, ...prev]);
      setHasMoreMessages(result.data.hasMore);
    }

    setIsLoadingMore(false);
  };

  // Send message (with optional images)
  const handleSend = async (
    content: string,
    replyToId?: string,
    images?: Array<{ url: string; width?: number; height?: number }>
  ) => {
    // Create optimistic message
    const tempId = `temp-${Date.now()}`;

    // DEBUG: Log replyTo state
    console.log('[TopicChat] handleSend called with replyTo state:', replyTo);
    console.log('[TopicChat] handleSend replyToId param:', replyToId);

    // FIX 9b.3: Build reply_to data from replyTo state for immediate display
    // Must satisfy TopicMessageWithAuthor type with all required fields
    const replyToData: TopicMessageWithAuthor | null = replyTo
      ? {
          id: replyTo.id,
          topic_id: topic.id,
          author_id: null,
          content: replyTo.content,
          message_type: 'text',
          metadata: null,
          reply_to_id: null,
          reactions: null,
          is_edited: false,
          edited_at: null,
          is_deleted: false,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: {
            id: '',
            name: replyTo.authorName || 'Utente',
            email: null,
            avatar: null,
          },
        }
      : null;

    const optimisticMessage: TopicMessageWithAuthor = {
      id: tempId,
      topic_id: topic.id,
      author_id: currentUserId,
      content,
      message_type: 'text',
      metadata: null,
      reply_to_id: replyToId || null,
      reactions: null,
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: currentUserName,
        email: null,
        avatar: null,
      },
      reply_to: replyToData, // FIX 9b.3: Use replyTo state data for immediate preview
    };

    console.log('[TopicChat] Optimistic message created with reply_to:', optimisticMessage.reply_to?.id, optimisticMessage.reply_to?.content?.substring(0, 30));
    addOptimisticMessage(optimisticMessage);
    scrollToBottom();

    // Send to server
    const result = await sendTopicMessage(topic.id, {
      content,
      replyToId,
      ...(images && images.length > 0 && {
        metadata: { images } as Record<string, unknown>,
      }),
    });

    if (result.error) {
      removeOptimisticMessage(tempId);
      throw new Error(result.error);
    }

    if (result.data) {
      console.log('[TopicChat] Server response received with reply_to:', result.data.reply_to?.id, result.data.reply_to?.content?.substring(0, 30));
      updateOptimisticMessage(tempId, result.data);
    }
  };

  // Handle image upload - returns uploaded image data (upload only, no message sent)
  const handleImageUpload = async (file: File): Promise<{ url: string; width?: number; height?: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const uploadResult = await uploadTopicImage(topic.id, formData);
    if (uploadResult.error) {
      throw new Error(uploadResult.error);
    }

    if (!uploadResult.data?.url) {
      throw new Error('Upload failed: no URL returned');
    }

    return {
      url: uploadResult.data.url,
      width: uploadResult.data.width,
      height: uploadResult.data.height,
    };
  };

  // Handle voice send (WhatsApp-style)
  const handleVoiceSend = async (
    blob: Blob,
    metadata: Omit<VoiceMessageMetadata, 'waveform'>
  ) => {
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');
    formData.append('duration', metadata.duration.toString());
    formData.append('mimeType', metadata.mimeType);

    const result = await sendVoiceMessage(topic.id, formData);

    if (result.error) {
      console.error('Error sending voice message:', result.error);
      alert('Errore nell\'invio del messaggio vocale');
      return;
    }

    scrollToBottom();
  };

  // Handle reply
  const handleReply = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyTo({
        id: message.id,
        content: message.content,
        authorName: message.author?.name || null,
      });
    }
  };

  // Handle edit
  const handleEdit = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const newContent = prompt('Modifica messaggio:', message.content);
    if (newContent && newContent !== message.content) {
      const result = await editTopicMessage(messageId, newContent);
      if (result.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...result.data } : m))
        );
      }
    }
  };

  // Handle delete
  const handleDelete = async (messageId: string) => {
    if (!confirm('Eliminare questo messaggio?')) return;

    const result = await deleteTopicMessage(messageId);
    if (!result.error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  // Handle reaction - pass emoji directly to server (no mapping needed)
  // IMPORTANT: User can only have ONE reaction per message - clicking a new emoji REPLACES the old one
  const handleReaction = async (messageId: string, emoji: string) => {
    // Validate messageId before proceeding (prevent "undefined" UUID errors)
    if (!messageId || messageId.startsWith('temp-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(messageId)) {
      console.warn('Cannot react to message with invalid or temporary ID:', messageId);
      return;
    }

    // Optimistic update using messageReactions state
    setMessageReactions((prev) => {
      const msgReactions = { ...(prev[messageId] || {}) };

      // Step 1: Find user's existing reaction (any emoji)
      let previousEmoji: string | null = null;
      for (const [existingEmoji, userIds] of Object.entries(msgReactions)) {
        if (userIds.includes(currentUserId)) {
          previousEmoji = existingEmoji;
          break;
        }
      }

      // Step 2: Remove user from previous emoji (if any)
      if (previousEmoji) {
        msgReactions[previousEmoji] = msgReactions[previousEmoji].filter(
          (id: string) => id !== currentUserId
        );
        if (msgReactions[previousEmoji].length === 0) {
          delete msgReactions[previousEmoji];
        }
      }

      // Step 3: If clicking NEW emoji → add; if SAME emoji → toggle off (already removed above)
      if (previousEmoji !== emoji) {
        if (!msgReactions[emoji]) {
          msgReactions[emoji] = [];
        }
        msgReactions[emoji] = [...msgReactions[emoji], currentUserId];
      }

      return { ...prev, [messageId]: msgReactions };
    });

    // Pass emoji directly to server - toggleReaction handles add/remove/change
    await toggleReaction(messageId, emoji);
  };

  // Handle mute toggle
  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await toggleTopicMute(topic.id, newMuted);
  };

  // Handle leave topic
  const handleLeave = async () => {
    if (!confirm('Vuoi lasciare questo topic?')) return;
    await leaveTopic(topic.id);
    window.location.href = '/community';
  };

  // Fetch members for info sheet
  const handleShowMembers = async () => {
    if (members.length === 0) {
      const result = await getTopicMembers(topic.id);
      if (result.data) {
        setMembers(result.data);
      }
    }
    setShowInfoSheet(true);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <ChatHeader
        topic={topic}
        typingUsers={typingUsers}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onLeave={handleLeave}
        onShowInfo={() => setShowInfoSheet(true)}
        onShowMembers={handleShowMembers}
        showBackButton={showBackButton}
      />

      {/* Messages area with SVG background */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `url(${getTopicBackground(topic.id)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <ScrollArea
          ref={scrollRef}
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="py-4">
            {/* Load more button */}
            {hasMoreMessages && (
              <div className="flex justify-center py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Caricamento...
                    </>
                  ) : (
                    'Carica messaggi precedenti'
                  )}
                </Button>
              </div>
            )}

            {/* Empty state */}
            {displayMessages.length === 0 && (
              <EmptyState
                icon={MessageSquare}
                title="Nessun messaggio"
                description="Sii il primo a scrivere in questo topic!"
                className="py-12"
              />
            )}

            {/* Messages */}
            {displayMessages.map((message, index) => {
              // Check if we should show avatar (first message or different author)
              const prevMessage = displayMessages[index - 1];
              const showAvatar =
                !prevMessage ||
                prevMessage.author.id !== message.author.id ||
                message.createdAt.getTime() - prevMessage.createdAt.getTime() >
                  5 * 60 * 1000; // 5 min gap

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onReply={canWrite ? handleReply : undefined}
                  onEdit={message.isCurrentUser ? handleEdit : undefined}
                  onDelete={message.isCurrentUser ? handleDelete : undefined}
                  onReaction={handleReaction}
                  showAvatar={showAvatar}
                  showName={showAvatar}
                />
              );
            })}

            {/* Typing indicator */}
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        </ScrollArea>

        {/* Scroll to bottom button with new message count */}
        {showScrollButton && (
          <Button
            variant="secondary"
            size={newMessageCount > 0 ? 'sm' : 'icon'}
            className={cn(
              'absolute bottom-4 right-4 rounded-full shadow-lg',
              newMessageCount > 0 && 'bg-teal-600 hover:bg-teal-700 text-white px-4'
            )}
            onClick={() => scrollToBottom()}
          >
            {newMessageCount > 0 ? (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {newMessageCount} {newMessageCount === 1 ? 'nuovo messaggio' : 'nuovi messaggi'}
              </>
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Input area */}
      {canWrite ? (
        <ChatInput
          onSend={handleSend}
          onTyping={setTyping}
          onImageUpload={handleImageUpload}
          onVoiceSend={handleVoiceSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          placeholder={`Scrivi in ${topic.name}...`}
        />
      ) : (
        <div className="border-t bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          Non hai i permessi per scrivere in questo topic
        </div>
      )}

      {/* Topic info sheet */}
      <TopicInfoSheet
        topic={topic}
        members={members}
        isOpen={showInfoSheet}
        onClose={() => setShowInfoSheet(false)}
      />
    </div>
  );
}
