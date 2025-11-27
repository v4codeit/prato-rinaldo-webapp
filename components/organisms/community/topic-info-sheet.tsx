'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TopicListItem, TopicMemberWithUser } from '@/types/topics';
import {
  getVisibilityLabel,
  getWritePermissionLabel,
  getMemberRoleLabel,
} from '@/types/topics';
import { getInitials } from '@/lib/utils/format';
import {
  Users,
  MessageSquare,
  Lock,
  Globe,
  Shield,
  UserCheck,
  Crown,
} from 'lucide-react';

interface TopicInfoSheetProps {
  topic: TopicListItem;
  members?: TopicMemberWithUser[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TopicInfoSheet - Side panel showing topic details and members
 */
export function TopicInfoSheet({
  topic,
  members = [],
  isOpen,
  onClose,
}: TopicInfoSheetProps) {
  const {
    name,
    icon,
    color,
    description,
    memberCount,
    messageCount,
    visibility,
    writePermission,
    isDefault,
  } = topic;

  // Group members by role
  const membersByRole = React.useMemo(() => {
    const groups: Record<string, TopicMemberWithUser[]> = {
      admin: [],
      moderator: [],
      writer: [],
      viewer: [],
    };

    members.forEach((member) => {
      groups[member.role]?.push(member);
    });

    return groups;
  }, [members]);

  // Get visibility icon
  const VisibilityIcon = {
    public: Globe,
    authenticated: UserCheck,
    verified: Shield,
    members_only: Lock,
  }[visibility];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <ScrollArea className="h-full">
          {/* Header with topic icon */}
          <div
            className="p-6 flex flex-col items-center text-center"
            style={{ backgroundColor: `${color}10` }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-4xl mb-4"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon || (
                <MessageSquare
                  className="h-10 w-10"
                  style={{ color }}
                />
              )}
            </div>
            <SheetTitle className="text-xl flex items-center gap-2">
              {name}
              {isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </SheetTitle>
            {description && (
              <SheetDescription className="mt-2 max-w-sm">
                {description}
              </SheetDescription>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 border-b">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{memberCount}</p>
                <p className="text-xs text-muted-foreground">Membri</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{messageCount}</p>
                <p className="text-xs text-muted-foreground">Messaggi</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="p-4 border-b space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Permessi
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                {VisibilityIcon && (
                  <VisibilityIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">Visibilità:</span>
                <span className="font-medium">
                  {getVisibilityLabel(visibility)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Scrittura:</span>
                <span className="font-medium">
                  {getWritePermissionLabel(writePermission)}
                </span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="p-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Membri ({members.length})
            </h3>

            {/* Admins */}
            {membersByRole.admin.length > 0 && (
              <MemberSection
                title="Amministratori"
                members={membersByRole.admin}
                roleColor="text-yellow-600"
              />
            )}

            {/* Moderators */}
            {membersByRole.moderator.length > 0 && (
              <MemberSection
                title="Moderatori"
                members={membersByRole.moderator}
                roleColor="text-blue-600"
              />
            )}

            {/* Writers */}
            {membersByRole.writer.length > 0 && (
              <MemberSection
                title="Membri"
                members={membersByRole.writer}
              />
            )}

            {/* Viewers */}
            {membersByRole.viewer.length > 0 && (
              <MemberSection
                title="Lettori"
                members={membersByRole.viewer}
                roleColor="text-muted-foreground"
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Member section component
function MemberSection({
  title,
  members,
  roleColor,
}: {
  title: string;
  members: TopicMemberWithUser[];
  roleColor?: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {title} ({members.length})
      </p>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={member.user.avatar || undefined}
                alt={member.user.name || ''}
              />
              <AvatarFallback className="text-xs">
                {getInitials(member.user.name || member.user.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.user.name || member.user.email}
              </p>
            </div>
            {member.role === 'admin' && (
              <Crown className={cn('h-4 w-4', roleColor)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
