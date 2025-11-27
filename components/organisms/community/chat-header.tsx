'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TopicListItem, TypingUser } from '@/types/topics';
import { getVisibilityLabel, getWritePermissionLabel } from '@/types/topics';
import { ROUTES } from '@/lib/utils/constants';
import {
  ArrowLeft,
  MoreVertical,
  Users,
  Settings,
  Bell,
  BellOff,
  Info,
  Lock,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import type { Route } from 'next';

interface ChatHeaderProps {
  topic: TopicListItem;
  typingUsers?: TypingUser[];
  isMuted?: boolean;
  onToggleMute?: () => void;
  onLeave?: () => void;
  onShowInfo?: () => void;
  onShowMembers?: () => void;
  showBackButton?: boolean;
  className?: string;
}

/**
 * ChatHeader - Header for the chat view showing topic info and actions
 */
export function ChatHeader({
  topic,
  typingUsers = [],
  isMuted = false,
  onToggleMute,
  onLeave,
  onShowInfo,
  onShowMembers,
  showBackButton = false,
  className,
}: ChatHeaderProps) {
  const {
    name,
    icon,
    color,
    memberCount,
    visibility,
    isMember,
    myRole,
  } = topic;

  const isPrivate = visibility === 'members_only' || visibility === 'verified';
  const canManage = myRole === 'admin' || myRole === 'moderator';

  // Format typing indicator text
  const typingText = React.useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} sta scrivendo...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} e ${typingUsers[1].name} stanno scrivendo...`;
    }
    return `${typingUsers.length} persone stanno scrivendo...`;
  }, [typingUsers]);

  return (
    <div className={cn('sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm shadow-sm', className)}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Back button (mobile) */}
        {showBackButton && (
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href={ROUTES.COMMUNITY as Route}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {/* Topic icon */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon || (
            <MessageSquare
              className="h-5 w-5"
              style={{ color }}
            />
          )}
        </div>

        {/* Topic info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{name}</h2>
            {isPrivate && (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {/* Typing indicator or member count */}
          {typingText ? (
            <p className="text-sm text-primary animate-pulse truncate">
              {typingText}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {memberCount} membri
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Members button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowMembers}
            className="hidden sm:flex"
          >
            <Users className="h-5 w-5" />
          </Button>

          {/* Mute toggle */}
          {isMember && onToggleMute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className="hidden sm:flex"
            >
              {isMuted ? (
                <BellOff className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowInfo}>
                <Info className="mr-2 h-4 w-4" />
                Info topic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowMembers} className="sm:hidden">
                <Users className="mr-2 h-4 w-4" />
                Membri ({memberCount})
              </DropdownMenuItem>
              {isMember && (
                <>
                  <DropdownMenuItem
                    onClick={onToggleMute}
                    className="sm:hidden"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Attiva notifiche
                      </>
                    ) : (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        Silenzia
                      </>
                    )}
                  </DropdownMenuItem>
                  {canManage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`${ROUTES.ADMIN_COMMUNITY}/${topic.slug}` as Route}>
                          <Settings className="mr-2 h-4 w-4" />
                          Gestisci topic
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {!topic.isDefault && myRole !== 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onLeave}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Lascia topic
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
