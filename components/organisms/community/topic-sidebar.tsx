'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TopicListItem } from './topic-list-item';
import { EmptyState } from '@/components/molecules/empty-state';
import type { TopicListItem as TopicListItemType } from '@/types/topics';
import { Search, Plus, MessageSquare } from 'lucide-react';

interface TopicSidebarProps {
  topics: TopicListItemType[];
  activeSlug?: string;
  canCreateTopic?: boolean;
  onCreateTopic?: () => void;
  className?: string;
}

/**
 * TopicSidebar - Left sidebar showing list of topics
 * Similar to Telegram's chat list
 */
export function TopicSidebar({
  topics,
  activeSlug,
  canCreateTopic = false,
  onCreateTopic,
  className,
}: TopicSidebarProps) {
  const [search, setSearch] = React.useState('');

  // Filter topics by search
  const filteredTopics = React.useMemo(() => {
    if (!search.trim()) return topics;

    const searchLower = search.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(searchLower) ||
        topic.description?.toLowerCase().includes(searchLower)
    );
  }, [topics, search]);

  // Separate pinned/default topics from regular ones
  const defaultTopics = filteredTopics.filter((t) => t.isDefault);
  const regularTopics = filteredTopics.filter((t) => !t.isDefault);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search and Create */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {canCreateTopic && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onCreateTopic}
          >
            <Plus className="h-4 w-4" />
            Nuovo Topic
          </Button>
        )}
      </div>

      {/* Topic List - ScrollArea with flex-1 min-w-0 to prevent display:table overflow */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="p-2">
          {filteredTopics.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={search ? 'Nessun risultato' : 'Nessun topic'}
              description={
                search
                  ? 'Prova con altri termini di ricerca'
                  : 'Non ci sono ancora topic disponibili'
              }
              className="py-8"
            />
          ) : (
            <>
              {/* Default/Pinned Topics */}
              {defaultTopics.length > 0 && (
                <div className="mb-2">
                  {defaultTopics.map((topic) => (
                    <TopicListItem
                      key={topic.id}
                      topic={topic}
                      isActive={topic.slug === activeSlug}
                    />
                  ))}
                </div>
              )}

              {/* Separator if both sections exist */}
              {defaultTopics.length > 0 && regularTopics.length > 0 && (
                <div className="h-px bg-border my-2" />
              )}

              {/* Regular Topics */}
              {regularTopics.map((topic) => (
                <TopicListItem
                  key={topic.id}
                  topic={topic}
                  isActive={topic.slug === activeSlug}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
