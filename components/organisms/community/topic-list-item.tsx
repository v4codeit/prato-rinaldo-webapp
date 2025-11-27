'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/utils/constants';
import type { TopicListItem as TopicListItemType } from '@/types/topics';
import {
  Lock,
  Users,
  MessageSquare,
} from 'lucide-react';
import type { Route } from 'next';

interface TopicListItemProps {
  topic: TopicListItemType;
  isActive?: boolean;
  showUnread?: boolean;
}

/**
 * TopicListItem - Displays a single topic in the sidebar list
 * Similar to Telegram channel/group item
 */
export function TopicListItem({
  topic,
  isActive = false,
  showUnread = true,
}: TopicListItemProps) {
  const {
    name,
    slug,
    icon,
    color,
    description,
    unreadCount,
    memberCount,
    messageCount,
    visibility,
  } = topic;

  const isPrivate = visibility === 'members_only' || visibility === 'verified';
  const hasUnread = showUnread && unreadCount > 0;

  // Framer Motion marquee: measure text width for pixel-accurate animation
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, [description]);

  return (
    <Link
      href={`${ROUTES.COMMUNITY}/${slug}` as Route}
      className={cn(
        'group/item flex items-start gap-3 p-3 rounded-lg transition-colors',
        'hover:bg-accent',
        isActive && 'bg-accent',
        hasUnread && 'bg-accent/50'
      )}
    >
      {/* Topic Icon */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-2xl flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon || (
          <MessageSquare
            className="h-6 w-6"
            style={{ color }}
          />
        )}
      </div>

      {/* Topic Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            'font-medium truncate',
            hasUnread && 'font-semibold'
          )}>
            {name}
          </h3>
          {isPrivate && (
            <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Description with continuous marquee effect (right to left) */}
        {description ? (
          <div className="overflow-hidden">
            {prefersReducedMotion ? (
              <p className="text-sm text-muted-foreground truncate">
                {description}
              </p>
            ) : (
              <motion.div
                className="flex whitespace-nowrap"
                animate={textWidth > 0 ? { x: [0, -(textWidth + 32)] } : {}}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: 'loop',
                    duration: Math.max(textWidth / 50, 4), // Dynamic duration based on text length
                    ease: 'linear',
                  },
                }}
              >
                <span
                  ref={textRef}
                  className="text-sm text-muted-foreground pr-8"
                >
                  {description}
                </span>
                <span
                  className="text-sm text-muted-foreground pr-8"
                  aria-hidden="true"
                >
                  {description}
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {messageCount} messaggi
          </p>
        )}
      </div>

      {/* Right side info */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Unread badge or member count */}
        {hasUnread ? (
          <Badge
            variant="default"
            className="h-5 min-w-[20px] px-1.5 text-xs font-semibold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {memberCount}
          </div>
        )}
      </div>
    </Link>
  );
}
