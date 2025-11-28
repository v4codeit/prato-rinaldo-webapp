'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { TopicListItem } from '@/components/organisms/community';
import { EmptyState } from '@/components/molecules/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { ROUTES } from '@/lib/utils/constants';
import type { TopicListItem as TopicListItemType } from '@/types/topics';
import { MessageSquare, Search, Plus } from 'lucide-react';
import type { Route } from 'next';

interface CommunityClientProps {
  topics: TopicListItemType[];
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

  // Subscribe to realtime unread count updates
  const { topicUnreads } = useUnreadCount({
    userId: currentUserId,
    enabled: true,
  });

  // Merge static topics with realtime unread counts
  const topicsWithRealtimeUnread = React.useMemo(() => {
    return topics.map((topic) => ({
      ...topic,
      // Use realtime unread count if available, otherwise keep static value
      unreadCount: topicUnreads.get(topic.id) ?? topic.unreadCount,
    }));
  }, [topics, topicUnreads]);

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
          'flex flex-col bg-white',
          isMobile ? 'w-full' : 'w-80 border-r'
        )}
      >
        {/* Header with Search (from demo/redesign ModernCommunity) */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b p-4 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Community</h1>
            <p className="text-slate-500">{topicsWithRealtimeUnread.length} canali attivi</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cerca un canale..."
              className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Topics List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-3xl m-2 border shadow-sm">
          {topicsWithRealtimeUnread.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Nessun topic disponibile</p>
            </div>
          ) : (
            topicsWithRealtimeUnread.map((topic) => (
              <TopicListItem
                key={`${topic.id}-${topic.unreadCount}`}
                topic={topic}
              />
            ))
          )}
        </div>

        {/* Create Topic Button (if authorized) */}
        {canCreateTopic && (
          <div className="p-4 border-t bg-white">
            <Button
              onClick={handleCreateTopic}
              className="w-full rounded-2xl bg-teal-600 hover:bg-teal-700 shadow-md"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuovo Canale
            </Button>
          </div>
        )}
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
