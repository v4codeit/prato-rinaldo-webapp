'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { TopicSidebar, TopicChat } from '@/components/organisms/community';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUI } from '@/lib/context/ui-context';
import { ROUTES } from '@/lib/utils/constants';
import type { TopicListItem, TopicMessageWithAuthor } from '@/types/topics';
import type { Route } from 'next';

interface TopicChatClientProps {
  topic: TopicListItem;
  allTopics: TopicListItem[];
  initialMessages: TopicMessageWithAuthor[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  canWrite: boolean;
}

/**
 * TopicChatClient - Client component for topic chat page
 * Handles responsive layout with sidebar and chat
 */
export function TopicChatClient({
  topic,
  allTopics,
  initialMessages,
  currentUserId,
  currentUserName,
  currentUserRole,
  canWrite,
}: TopicChatClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { setCommunityFullscreen } = useUI();

  // Hide bottom nav when in topic chat (fullscreen mode)
  React.useEffect(() => {
    setCommunityFullscreen(true);
    return () => setCommunityFullscreen(false);
  }, [setCommunityFullscreen]);

  // Check if user can create topics (admin only)
  const canCreateTopic = ['admin', 'super_admin'].includes(currentUserRole);

  // Handle create topic
  const handleCreateTopic = () => {
    router.push(`${ROUTES.ADMIN_COMMUNITY}/new` as Route);
  };

  return (
    <div className="flex h-[calc(100dvh-0.5rem)] w-full">
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <div className="w-80 border-r bg-background flex-shrink-0">
          <TopicSidebar
            topics={allTopics}
            activeSlug={topic.slug}
            canCreateTopic={canCreateTopic}
            onCreateTopic={handleCreateTopic}
            currentUserId={currentUserId}
            className="h-full"
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        <TopicChat
          topic={topic}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          canWrite={canWrite}
          showBackButton={isMobile}
          className="h-full"
        />
      </div>
    </div>
  );
}
