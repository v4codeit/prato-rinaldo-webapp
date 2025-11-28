'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { MessageDisplayItem } from '@/types/topics';
import { formatMessageTime, isVoiceMessage, getImagesFromMetadata } from '@/types/topics';
import { ReactionPickerPopover } from '@/components/molecules/reaction-picker-popover';
import { VoiceMessagePlayer } from './voice/voice-message-player';
import { MessageImageGrid } from './message-image-grid';
import { MessageImageLightbox } from './message-image-lightbox';
import { getInitials } from '@/lib/utils/format';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import {
  MoreVertical,
  Reply,
  Pencil,
  Trash2,
  Copy,
  Check,
  SmilePlus,
} from 'lucide-react';

// Quick reaction emojis for mobile long-press menu
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const;

interface ChatMessageProps {
  message: MessageDisplayItem;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  showAvatar?: boolean;
  showName?: boolean;
}

/**
 * ChatMessage - Individual message in the chat
 * WhatsApp-style compact bubbles with inline time, reactions, and context menu
 */
export function ChatMessage({
  message,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  showAvatar = true,
  showName = true,
}: ChatMessageProps) {
  const {
    id,
    content,
    messageType,
    metadata,
    author,
    isCurrentUser,
    createdAt,
    isEdited,
    reactions,
    replyTo,
  } = message;

  // Check if message has images (supports new multi-image and legacy single-image format)
  const images = getImagesFromMetadata(metadata);
  const hasImagesInMessage = images.length > 0;

  // Check if message is a voice message
  const hasVoice = isVoiceMessage(metadata);

  const [copied, setCopied] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Mobile detection
  const isMobile = useIsMobile();

  // Swipe animation spring (for swipe-to-reply)
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  // Long press implementation for mobile (manual - @use-gesture doesn't have useLongPress)
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = React.useRef(false);

  const handleTouchStart = React.useCallback(() => {
    if (!isMobile) return;
    longPressTriggeredRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setMobileMenuOpen(true);
    }, 500); // 500ms long press
  }, [isMobile]);

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handleTouchMove = React.useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Drag gesture for swipe-to-reply (only on received messages)
  const SWIPE_THRESHOLD = 60;
  const bindDrag = useDrag(
    ({ down, movement: [mx], cancel }) => {
      if (!isMobile || !onReply) return;

      // Only allow right swipe for received messages, left swipe for own messages
      const validDirection = isCurrentUser ? mx < 0 : mx > 0;
      const absX = Math.abs(mx);

      if (!validDirection) {
        api.start({ x: 0 });
        return;
      }

      if (down) {
        // Clamp the movement
        const clampedX = isCurrentUser
          ? Math.max(mx, -100)
          : Math.min(mx, 100);
        api.start({ x: clampedX, immediate: true });

        // Haptic when reaching threshold
        if (absX >= SWIPE_THRESHOLD && absX < SWIPE_THRESHOLD + 5) {
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        }
      } else {
        // Released - check if past threshold
        if (absX >= SWIPE_THRESHOLD) {
          onReply(id);
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 30, 30]);
          }
        }
        api.start({ x: 0 });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      enabled: isMobile && !!onReply,
    }
  );

  // Copy message to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMobileMenuOpen(false);
  };

  // Handle mobile reaction
  const handleMobileReaction = (emoji: string) => {
    onReaction?.(id, emoji);
    setMobileMenuOpen(false);
  };

  // For messages without text but with media, we need different layout
  const hasOnlyMedia = !content && (hasImagesInMessage || hasVoice);

  return (
    <div
      className={cn(
        'flex py-0.5',
        isCurrentUser
          ? 'flex-row-reverse gap-2 px-3'  // Messaggi propri: più spazio
          : 'gap-1 px-1.5'                  // Messaggi ricevuti: più compatti
      )}
    >
      {/* Avatar o spacer - SOLO per messaggi ricevuti */}
      {!isCurrentUser && (
        showAvatar ? (
          <Avatar className="h-8 w-8 border border-white shadow-sm flex-shrink-0 mt-0.5">
            <AvatarImage src={author.avatar || undefined} alt={author.name || ''} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
              {getInitials(author.name || '?')}
            </AvatarFallback>
          </Avatar>
        ) : (
          // Spacer per mantenere allineamento quando non c'è avatar
          <div className="w-8 flex-shrink-0" />
        )
      )}
      {/* NO spacer per messaggi propri - sono allineati a destra automaticamente */}

      {/* Message Bubble - Everything INSIDE */}
      {/* Wrapped in Popover for mobile long-press menu */}
      {/* FIX 9b.2a: On mobile, ignore click-to-open from PopoverTrigger, only allow long-press */}
      <Popover
        open={mobileMenuOpen}
        onOpenChange={(open) => {
          // On mobile, only allow closing (click outside), not opening via tap
          // Opening is handled exclusively by long-press (handleTouchStart)
          if (isMobile && open) return;
          setMobileMenuOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <animated.div
            {...(isMobile ? bindDrag() : {})}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onTouchCancel={handleTouchEnd}
            style={{ x }}
            className={cn(
              'relative max-w-[85%] rounded-lg shadow-sm touch-pan-y',
              // Only add hover group on desktop
              !isMobile && 'group/bubble',
              isCurrentUser
                ? 'bg-[#D6FAD0] text-slate-900 rounded-tr-sm'
                : 'bg-white text-slate-800 rounded-tl-sm',
              // Extra padding at bottom when reactions are shown
              reactions.length > 0 && 'mb-3',
              // Cursor for mobile
              isMobile && 'cursor-pointer select-none'
            )}
          >
            {/* Author name - INSIDE bubble (only for received messages) */}
            {showName && !isCurrentUser && (
              <p className="px-2.5 pt-1.5 pb-0 text-xs font-semibold text-teal-700">
                {author.name || author.id}
              </p>
            )}

            {/* Reply preview - INSIDE bubble */}
            {replyTo?.content && (
              <div
                className={cn(
                  'mx-2 mt-1.5 px-2 py-1 rounded text-xs border-l-2',
                  isCurrentUser
                    ? 'bg-slate-100 border-teal-600'
                    : 'bg-slate-100 border-teal-500'
                )}
              >
                <p className={cn(
                  "font-semibold text-[11px]",
                  'text-teal-700'
                )}>
                  {replyTo.authorName || 'Utente'}
                </p>
                <p className={cn(
                  "truncate",
                  'text-slate-500'
                )}>
                  {replyTo.content}
                </p>
              </div>
            )}

            {/* Image attachment(s) with grid layout */}
            {hasImagesInMessage && !hasVoice && (
              <div className={cn(
                "p-1",
                !showName && !replyTo?.content && !isCurrentUser && "pt-1",
                showName && !isCurrentUser && "pt-1"
              )}>
                <MessageImageGrid
                  images={images}
                  isCurrentUser={isCurrentUser}
                  onImageClick={(index) => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            )}

            {/* Voice message */}
            {hasVoice && (
              <div className="py-1 px-2">
                <VoiceMessagePlayer
                  audioUrl={metadata.url}
                  metadata={metadata.voice}
                  isCurrentUser={isCurrentUser}
                  createdAt={formatMessageTime(createdAt)}
                />
              </div>
            )}

            {/* Text content with inline time - INSIDE bubble */}
            {content && !hasVoice && (
              <div className={cn(
                "px-2.5 pb-1.5",
                // Add top padding only if no name/reply above
                !showName && !replyTo?.content && !hasImagesInMessage ? "pt-1.5" : "pt-1",
                isCurrentUser && !replyTo?.content && !hasImagesInMessage && "pt-1.5"
              )}>
                <p className="text-sm leading-snug whitespace-pre-wrap break-words inline">
                  {content}
                </p>
                {/* Time + edited indicator - inline at the end */}
                <span className={cn(
                  "text-[10px] ml-2 float-right mt-1 whitespace-nowrap select-none",
                  isCurrentUser ? 'text-teal-800/70' : 'text-slate-400'
                )}>
                  {isEdited && <span className="mr-0.5">✎</span>}
                  {formatMessageTime(createdAt)}
                </span>
              </div>
            )}

            {/* Time for media-only messages (no text) */}
            {hasOnlyMedia && (
              <div className={cn(
                "absolute bottom-1 right-2 text-[10px] px-1.5 py-0.5 rounded",
                isCurrentUser
                  ? 'bg-black/30 text-white'
                  : 'bg-black/50 text-white'
              )}>
                {isEdited && <span className="mr-0.5">✎</span>}
                {formatMessageTime(createdAt)}
              </div>
            )}

            {/* Reactions - positioned below bubble */}
            {reactions.length > 0 && (
              <div className={cn(
                "absolute -bottom-2.5 flex flex-nowrap gap-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm px-1.5 py-0.5",
                isCurrentUser ? "right-2" : "left-2"
              )}>
                {[...reactions]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 4)
                  .map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => onReaction?.(id, reaction.emoji)}
                      className="flex items-center text-xs hover:scale-110 transition-transform"
                    >
                      <span className="text-sm">{reaction.emoji}</span>
                    </button>
                  ))}
                <span className="text-[11px] text-slate-600 font-medium">
                  {reactions.reduce((sum, r) => sum + r.count, 0)}
                </span>
              </div>
            )}

            {/* Hover actions - DESKTOP ONLY */}
            {!isMobile && (
              <div
                className={cn(
                  'absolute -top-1 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10',
                  isCurrentUser ? '-left-16' : '-right-16'
                )}
              >
                {/* Reaction picker */}
                <ReactionPickerPopover onReactionSelect={(emoji) => onReaction?.(id, emoji)}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/90 border shadow-sm hover:bg-white">
                    <SmilePlus className="h-3.5 w-3.5" />
                  </Button>
                </ReactionPickerPopover>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/90 border shadow-sm hover:bg-white"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isCurrentUser ? 'end' : 'start'}>
                    <DropdownMenuItem onClick={() => onReply?.(id)}>
                      <Reply className="mr-2 h-4 w-4" />
                      Rispondi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copia testo
                        </>
                      )}
                    </DropdownMenuItem>
                    {isCurrentUser && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit?.(id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </animated.div>
        </PopoverTrigger>

        {/* Mobile long-press action menu */}
        <PopoverContent
          side={isCurrentUser ? 'left' : 'right'}
          align="start"
          className="w-auto p-2"
          sideOffset={8}
        >
          {/* Quick reactions row */}
          <div className="flex gap-1 pb-2 border-b mb-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleMobileReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  onReply(id);
                  setMobileMenuOpen(false);
                }}
              >
                <Reply className="mr-2 h-4 w-4" />
                Rispondi
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiato!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copia testo
                </>
              )}
            </Button>
            {isCurrentUser && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  onEdit(id);
                  setMobileMenuOpen(false);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            )}
            {isCurrentUser && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(id);
                  setMobileMenuOpen(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Image Lightbox (portal) */}
      {hasImagesInMessage && (
        <MessageImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          caption={content || undefined}
        />
      )}
    </div>
  );
}
