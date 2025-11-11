'use client';

import { useTransition } from 'react';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { InteractionBarProps } from '@/types/feed';

/**
 * Interaction bar component for feed items
 * Displays Like, Comment, Share, and View counts with interactive buttons
 *
 * Pattern based on ProposalVoteWidget with optimistic updates
 *
 * @example
 * ```tsx
 * <InteractionBar
 *   likes={42}
 *   comments={12}
 *   shares={5}
 *   views={234}
 *   onLike={handleLike}
 *   onComment={handleComment}
 *   onShare={handleShare}
 * />
 * ```
 */
export function InteractionBar({
  likes,
  comments,
  shares = 0,
  views,
  onLike,
  onComment,
  onShare,
  isPending = false,
  showLabels = false,
  className,
}: InteractionBarProps) {
  const [isLocalPending, startTransition] = useTransition();
  const pending = isPending || isLocalPending;

  const handleLike = () => {
    if (!onLike || pending) return;
    startTransition(() => {
      onLike();
    });
  };

  const handleComment = () => {
    if (!onComment || pending) return;
    startTransition(() => {
      onComment();
    });
  };

  const handleShare = () => {
    if (!onShare || pending) return;
    startTransition(() => {
      onShare();
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-6 text-sm text-muted-foreground',
        className
      )}
    >
      {/* Like Button */}
      {onLike && (
        <button
          onClick={handleLike}
          disabled={pending}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            'hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'rounded-md px-2 py-1 -mx-2'
          )}
          aria-label={`${likes} Mi piace`}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-all',
              pending && 'animate-pulse'
            )}
          />
          <span className="font-medium">{likes}</span>
          {showLabels && <span className="hidden sm:inline">Mi piace</span>}
        </button>
      )}

      {/* Comment Button */}
      {onComment && (
        <button
          onClick={handleComment}
          disabled={pending}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            'hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'rounded-md px-2 py-1 -mx-2'
          )}
          aria-label={`${comments} Commenti`}
        >
          <MessageCircle
            className={cn(
              'h-5 w-5 transition-all',
              pending && 'animate-pulse'
            )}
          />
          <span className="font-medium">{comments}</span>
          {showLabels && <span className="hidden sm:inline">Commenti</span>}
        </button>
      )}

      {/* Share Button */}
      {onShare && shares > 0 && (
        <button
          onClick={handleShare}
          disabled={pending}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            'hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'rounded-md px-2 py-1 -mx-2'
          )}
          aria-label={`${shares} Condivisioni`}
        >
          <Share2
            className={cn(
              'h-5 w-5 transition-all',
              pending && 'animate-pulse'
            )}
          />
          <span className="font-medium">{shares}</span>
          {showLabels && <span className="hidden sm:inline">Condividi</span>}
        </button>
      )}

      {/* Views (read-only) */}
      {views !== undefined && views > 0 && (
        <div
          className="flex items-center gap-1.5"
          aria-label={`${views} Visualizzazioni`}
        >
          <Eye className="h-5 w-5" />
          <span className="font-medium">{views}</span>
          {showLabels && <span className="hidden sm:inline">Visualizzazioni</span>}
        </div>
      )}
    </div>
  );
}
