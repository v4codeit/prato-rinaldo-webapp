'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { TopicSidebar } from '@/components/organisms/community';
import { EmptyState } from '@/components/molecules/empty-state';
import { useIsMobile } from '@/hooks/use-mobile';
import { ROUTES } from '@/lib/utils/constants';
import type { TopicListItem } from '@/types/topics';
import { MessageSquare } from 'lucide-react';
import type { Route } from 'next';

interface CommunityClientProps {
  topics: TopicListItem[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

/**
 * CommunityClient - Client component for community page
 * Handles responsive layout and topic selection
 */
export function CommunityClient({
  topics,
  currentUserId,
  currentUserName,
  currentUserRole,
}: CommunityClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Check if user can create topics (admin only)
  const canCreateTopic = ['admin', 'super_admin'].includes(currentUserRole);

  // Handle create topic
  const handleCreateTopic = () => {
    router.push(`${ROUTES.ADMIN_COMMUNITY}/new` as Route);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Sidebar - full width on mobile, fixed width on desktop */}
      <div
        className={cn(
          'flex flex-col border-r bg-background',
          isMobile ? 'w-full' : 'w-80'
        )}
      >
        <TopicSidebar
          topics={topics}
          canCreateTopic={canCreateTopic}
          onCreateTopic={handleCreateTopic}
          className="h-full"
        />
      </div>

      {/* Main content - only on desktop */}
      {!isMobile && (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <EmptyState
            icon={MessageSquare}
            title="Seleziona un topic"
            description="Scegli un topic dalla lista per iniziare a chattare"
          />
        </div>
      )}
    </div>
  );
}
