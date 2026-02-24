'use client';

import { useRouter } from 'next/navigation';
import { UnifiedFeedCard } from '@/components/feed/unified-feed-card';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/utils/constants';
import type { Route } from 'next';
import type { UnifiedFeedItem, FeedItemType } from '@/types/feed';

interface FeedClientProps {
  feedItems: UnifiedFeedItem[];
  returnTo?: string; // Optional return path for smart back button
}

/**
 * Client Component wrapper for feed items
 * Handles event handlers that cannot be passed from Server Component
 *
 * Pattern follows MarketplaceSection approach:
 * - Server Component fetches data
 * - Client Component manages interactivity
 * - Handlers are defined in Client Component (serialization-safe)
 */
export function FeedClient({ feedItems, returnTo = '/feed' }: FeedClientProps) {
  const router = useRouter();

  /**
   * Like handler - Shows toast notification
   * TODO: Implement real like system with Server Action
   */
  const handleLike = (id: string) => {
    console.log('[Feed] Like:', id);
    toast('Mi piace aggiunto', {
      description: 'La funzione sarà disponibile a breve!',
    });
  };

  /**
   * Comment handler - Navigates to detail page with comment anchor
   */
  const handleComment = (id: string) => {
    router.push(`/feed/${id}#comments` as any);
  };

  /**
   * Share handler - Uses Web Share API on mobile, clipboard on desktop
   */
  const handleShare = async (id: string) => {
    const shareUrl = `${window.location.origin}/feed/${id}`;

    try {
      // Try Web Share API first (mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'Community Prato Rinaldo',
          text: 'Dai un\'occhiata a questo contenuto',
          url: shareUrl,
        });
        toast.success('Condiviso con successo!');
      } else {
        // Fallback to clipboard (desktop)
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiato', {
          description: 'Il link è stato copiato negli appunti',
        });
      }
    } catch (error) {
      // User cancelled share or clipboard failed
      console.log('[Feed] Share cancelled or failed:', error);
    }
  };

  /**
   * Card click handler - Navigates to detail page based on item type
   * Adds returnTo param for smart back button
   */
  const handleCardClick = (id: string, type: FeedItemType) => {
    switch (type) {
      case 'event':
        router.push(`${ROUTES.EVENTS}/${id}?returnTo=${encodeURIComponent(returnTo)}` as Route);
        break;
      case 'mercatino':
      case 'marketplace':
        // Both types route to /mercatino (ROUTES.MERCATINO)
        router.push(`${ROUTES.MERCATINO}/${id}?returnTo=${encodeURIComponent(returnTo)}` as Route);
        break;
      case 'proposal':
        router.push(`${ROUTES.AGORA}/${id}?returnTo=${encodeURIComponent(returnTo)}` as Route);
        break;
      case 'announcement':
        // Announcements don't have detail page yet - no action
        console.log('[Feed] Announcement click - no detail page');
        break;
    }
  };

  return (
    <div className="space-y-4">
      {feedItems.map((item) => (
        <UnifiedFeedCard
          key={item.id}
          item={item}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  );
}
