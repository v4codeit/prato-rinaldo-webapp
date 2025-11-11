import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { getInitials } from '@/lib/utils/format';

interface MessageBubbleProps {
  content: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: string;
  isMine: boolean;
}

/**
 * MessageBubble Component
 *
 * Reusable message bubble for chat interface.
 * Renders differently based on whether message is from current user.
 *
 * Features:
 * - Different alignment for sent/received messages
 * - Avatar display for other user
 * - Relative timestamp
 * - Max-width constraint
 * - Responsive design
 *
 * @example
 * <MessageBubble
 *   content="Ciao! È ancora disponibile?"
 *   senderName="Mario Rossi"
 *   senderAvatar="https://..."
 *   timestamp="2024-01-15T10:30:00Z"
 *   isMine={false}
 * />
 */
export function MessageBubble({
  content,
  senderName,
  senderAvatar,
  timestamp,
  isMine,
}: MessageBubbleProps) {
  // Format timestamp to relative time (e.g., "2 ore fa", "ieri")
  const formattedTime = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: it,
      });
    } catch (error) {
      return 'ora';
    }
  }, [timestamp]);

  // Get initials for avatar fallback
  const initials = getInitials(senderName);

  return (
    <div
      className={cn(
        'flex w-full gap-3 mb-4',
        isMine ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar for received messages */}
      {!isMine && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[75%] sm:max-w-[65%]',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender name (only for received messages) */}
        {!isMine && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 break-words',
            isMine
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-1">
          {formattedTime}
        </span>
      </div>

      {/* Spacer for sent messages to align avatar position */}
      {isMine && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
