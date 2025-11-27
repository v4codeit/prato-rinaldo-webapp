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
import type { MessageDisplayItem } from '@/types/topics';
import { formatMessageTime, isVoiceMessage, getImagesFromMetadata } from '@/types/topics';
import { ReactionPickerPopover } from '@/components/molecules/reaction-picker-popover';
import { VoiceMessagePlayer } from './voice/voice-message-player';
import { MessageImageGrid } from './message-image-grid';
import { MessageImageLightbox } from './message-image-lightbox';
import { getInitials } from '@/lib/utils/format';
import {
  MoreVertical,
  Reply,
  Pencil,
  Trash2,
  Copy,
  Check,
  SmilePlus,
} from 'lucide-react';

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
 * Telegram/WhatsApp style with reactions, replies, and context menu
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

  // Copy message to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pinned message indicator (optional styling)
  // System messages are handled via metadata in new schema

  return (
    <div
      className={cn(
        'flex gap-4 px-6 py-3',
        isCurrentUser && 'flex-row-reverse'
      )}
    >

      {/* Avatar - only for received messages */}
      {showAvatar && !isCurrentUser && (
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
          <AvatarImage src={author.avatar || undefined} alt={author.name || ''} />
          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {getInitials(author.name || '?')}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-md',
          isCurrentUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Author name + time */}
        <div className={cn(
          "flex items-baseline gap-2 mb-1",
          isCurrentUser && "justify-end flex-row-reverse"
        )}>
          {(showName && !isCurrentUser) && (
            <span className="font-bold text-sm text-slate-900">{author.name || author.id}</span>
          )}
          <span className="text-xs text-slate-400">{formatMessageTime(createdAt)}</span>
        </div>

        {/* Reply preview */}
        {replyTo?.content && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs mb-1 px-3 py-1.5 rounded-lg border-l-2 max-w-full',
              isCurrentUser
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-slate-100 border-slate-300'
            )}
          >
            <Reply className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium truncate">
              {replyTo.authorName || 'Utente'}
            </span>
            <span className="truncate text-muted-foreground">
              {replyTo.content}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'relative rounded-2xl text-sm shadow-sm group/bubble',
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-slate-100 text-slate-800 rounded-tl-none'
          )}
        >
          {/* Image attachment(s) with grid layout */}
          {hasImagesInMessage && !hasVoice && (
            <div className="p-1">
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
              />
            </div>
          )}

          {/* Text content (hide for voice messages) */}
          {content && !hasVoice && (
            <p className="px-4 py-3 leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          )}

          {/* Edited indicator */}
          {isEdited && (
            <span className={cn(
              "text-[10px] italic px-4 pb-1 block",
              isCurrentUser ? 'text-white/70' : 'text-slate-400'
            )}>
              modificato
            </span>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="absolute -bottom-2 flex flex-nowrap gap-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm px-1.5 py-0.5">
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

          {/* Hover actions - moved inside bubble */}
          <div
            className={cn(
              'absolute top-1 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity',
              isCurrentUser ? 'right-1' : 'left-1'
            )}
          >
            {/* Reaction picker */}
            <ReactionPickerPopover onReactionSelect={(emoji) => onReaction?.(id, emoji)}>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/90 border shadow-sm hover:bg-white">
                <SmilePlus className="h-4 w-4" />
              </Button>
            </ReactionPickerPopover>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/90 border shadow-sm hover:bg-white"
                >
                  <MoreVertical className="h-4 w-4" />
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
        </div>
      </div>

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
