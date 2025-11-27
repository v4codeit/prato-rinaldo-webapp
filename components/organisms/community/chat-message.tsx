'use client';

import * as React from 'react';
import Image from 'next/image';
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
import type { MessageDisplayItem, AvailableReaction, VoiceMessageMetadata } from '@/types/topics';
import { AVAILABLE_REACTIONS, formatMessageTime, isVoiceMessage } from '@/types/topics';
import { VoiceMessagePlayer } from './voice/voice-message-player';
import { getInitials } from '@/lib/utils/format';
import {
  MoreVertical,
  Reply,
  Pencil,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessageProps {
  message: MessageDisplayItem;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: AvailableReaction) => void;
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

  // Check if message has image in metadata
  const hasImage = metadata && typeof metadata === 'object' && 'url' in metadata;

  // Check if message is a voice message
  const hasVoice = isVoiceMessage(metadata);

  const [copied, setCopied] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);

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
        'group flex gap-1 py-0.5 px-4 hover:bg-accent/50 transition-colors',
        isCurrentUser && 'flex-row-reverse'
      )}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >

      {/* Avatar */}
      {showAvatar && !isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={author.avatar || undefined} alt={author.name || ''} />
          <AvatarFallback className="text-xs">
            {getInitials(author.name || '?')}
          </AvatarFallback>
        </Avatar>
      )}
      {showAvatar && !isCurrentUser ? null : !isCurrentUser && <div className="w-8 flex-shrink-0" />}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[75%] sm:max-w-[65%]',
          isCurrentUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Reply preview - only show if there's actual reply content */}
        {replyTo?.content && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs mb-1 px-3 py-1.5 rounded-t-lg border-l-2',
              isCurrentUser
                ? 'bg-primary/10 border-primary/50'
                : 'bg-muted/80 border-muted-foreground/30'
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

        {/* Bubble + Reactions wrapper */}
        <div
          className={cn(
            'flex items-end gap-1.5',
            isCurrentUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              'relative rounded-2xl shadow-sm  min-w-[150px]',
              isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md',
              replyTo?.content && 'rounded-t-none'
            )}
          >
            {/* Author name */}
            {showName && !isCurrentUser && (
              <div className="px-1.5 py-1 pl-2 pr-0 pb-0 flex justify-start">
                <span className="text-xs leading-relaxed font-medium mb-0.5">
                  {author.name || author.id}
                </span>
              </div>
            )}

            {/* Image attachment */}
            {hasImage && metadata && !hasVoice && (
              <div className="p-1">
                <Image
                  src={(metadata as { url: string }).url}
                  alt={(metadata as { alt?: string }).alt || 'Immagine'}
                  width={(metadata as { width?: number }).width || 300}
                  height={(metadata as { height?: number }).height || 200}
                  className="rounded max-w-full h-auto"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Voice message */}
            {hasVoice && (
              <div className="p-2">
                <VoiceMessagePlayer
                  audioUrl={metadata.url}
                  metadata={metadata.voice}
                  isCurrentUser={isCurrentUser}
                />
              </div>
            )}

            {/* Text content (hide for voice messages) */}
            {content && !hasVoice && (
              <p className={cn("px-2 text-sm leading-relaxed whitespace-pre-wrap break-words", isCurrentUser ? 'pt-2' : 'pt-0')}>
                {content}
              </p>
            )}

            {/* Time and edited indicator */}
            <div
              className={cn(
                'flex items-center gap-1 px-3 pb-1.5 text-[10px] justify-end',
                isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {isEdited && <span className="italic">modificato</span>}
              <span>{formatMessageTime(createdAt)}</span>
            </div>

            {/* Reactions - Max 4, show total count */}
            {reactions.length > 0 && (
              <div className="absolute -bottom-2 flex flex-nowrap gap-0.5 mb-1.5 rounded-full bg-primary border-green-900/30 text-primary shadow-sm transition-colors border">
                {/* Show top 4 reactions by count */}
                {[...reactions]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 4)
                  .map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => onReaction?.(id, reaction.emoji as AvailableReaction)}
                      className="flex items-center text-xs px-0.5"
                    >
                      <span className="text-sm">{reaction.emoji}</span>
                    </button>
                  ))}
                {/* Total reaction count (sum of all reactions) */}
                <span className="flex items-center text-[11px] text-white pl-1 pr-2">
                  {reactions.reduce((sum, r) => sum + r.count, 0)}
                </span>
              </div>
            )}
          </div>



        </div>
      </div>
      {/* Hover actions */}
      <div
        className={cn(
          'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isCurrentUser && 'flex-row-reverse'
        )}
      >
        {/* Quick reactions */}
        <div className="flex items-center gap-0.5 bg-background border rounded-full px-1 py-0.5 shadow-sm">
          {AVAILABLE_REACTIONS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction?.(id, emoji)}
              className="p-1 hover:bg-accent rounded-full transition-colors text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background border shadow-sm"
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
      {/* Spacer for alignment */}
      {isCurrentUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
