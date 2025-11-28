'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import type { TopicListItem as TopicListItemType } from '@/types/topics';
import { Lock, MessageSquare } from 'lucide-react';
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

  // Marquee animation for long descriptions
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const [textWidth, setTextWidth] = React.useState(0);

  React.useEffect(() => {
    if (!description || prefersReducedMotion) return;

    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textW = textRef.current.scrollWidth;
        setTextWidth(textW);
        setShouldAnimate(textW > containerWidth);
      }
    };

    // Check on mount and resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [description, prefersReducedMotion]);

  const displayText = description || `${memberCount} membri`;

  return (
    <Link
      href={`${ROUTES.COMMUNITY}/${slug}` as Route}
      className={cn(
        'flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-none group',
        isActive && 'bg-blue-50/50',
        hasUnread && 'bg-blue-50/30'
      )}
    >
      {/* Avatar with gradient background */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0",
        icon ? "bg-white" : "bg-gradient-to-br from-blue-500 to-indigo-600"
      )}
        style={icon ? { backgroundColor: `${color}30` } : undefined}
      >
        {icon || <MessageSquare className="h-6 w-6 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-slate-900",
              hasUnread ? "font-bold text-blue-700" : "font-semibold"
            )}>
              #{name}
            </h3>
            {isPrivate && (
              <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {messageCount > 0 ? `${messageCount} msg` : 'Nuovo'}
          </span>
        </div>

        {/* Description with marquee for long text */}
        <div ref={containerRef} className="overflow-hidden">
          {shouldAnimate && textWidth > 0 ? (
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: [0, -(textWidth + 32)] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: Math.max(textWidth / 40, 5),
                  ease: 'linear',
                },
              }}
            >
              <span ref={textRef} className="text-sm text-slate-500 pr-8">
                {displayText}
              </span>
              <span className="text-sm text-slate-500 pr-8" aria-hidden="true">
                {displayText}
              </span>
            </motion.div>
          ) : (
            <p className="text-sm text-slate-500 truncate">
              <span ref={textRef}>{displayText}</span>
            </p>
          )}
        </div>
      </div>

      {/* Unread Badge */}
      {hasUnread && (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </Link>
  );
}
