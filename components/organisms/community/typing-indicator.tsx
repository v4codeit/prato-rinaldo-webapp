'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { TypingUser } from '@/types/topics';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

/**
 * TypingIndicator - Shows animated typing dots with user names
 */
export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  // Format text based on number of typing users
  const text = React.useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} sta scrivendo`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} e ${typingUsers[1].name} stanno scrivendo`;
    }
    return `${typingUsers.length} persone stanno scrivendo`;
  }, [typingUsers]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground',
        className
      )}
    >
      {/* Animated dots */}
      <div className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
      </div>
      <span>{text}</span>
    </div>
  );
}
