'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  Tag,
  Users,
  ArrowUp,
  Megaphone,
  MoreVertical,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InteractionBar } from './interaction-bar';
import { getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type {
  UnifiedFeedItem,
  UnifiedFeedCardProps,
  EventFeedItem,
  MarketplaceFeedItem,
  ProposalFeedItem,
  AnnouncementFeedItem,
} from '@/types/feed';

/**
 * Helper function to get the appropriate icon for each feed item type
 */
function getTypeIcon(type: UnifiedFeedItem['type']) {
  switch (type) {
    case 'event':
      return <Calendar className="h-5 w-5" />;
    case 'marketplace':
      return <Tag className="h-5 w-5" />;
    case 'proposal':
      return <ArrowUp className="h-5 w-5" />;
    case 'announcement':
      return <Megaphone className="h-5 w-5" />;
  }
}

/**
 * Helper function to get type-specific badge color
 */
function getTypeBadgeVariant(type: UnifiedFeedItem['type']) {
  switch (type) {
    case 'event':
      return 'default';
    case 'marketplace':
      return 'secondary';
    case 'proposal':
      return 'outline';
    case 'announcement':
      return 'destructive';
  }
}

/**
 * Renders media (cover image) if present
 */
function renderMedia(item: UnifiedFeedItem) {
  // For marketplace items, show first image from metadata
  if (item.type === 'marketplace' && item.metadata.images.length > 0) {
    return (
      <div className="mt-4 rounded-lg overflow-hidden">
        <img
          src={item.metadata.images[0]}
          alt={item.title}
          className="w-full h-48 object-cover"
        />
      </div>
    );
  }

  // For other items, show cover image if present
  if (item.coverImage) {
    return (
      <div className="mt-4 rounded-lg overflow-hidden">
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-48 object-cover"
        />
      </div>
    );
  }

  return null;
}

/**
 * Renders type-specific metadata for each feed item
 */
function renderTypeSpecificMetadata(item: UnifiedFeedItem) {
  switch (item.type) {
    case 'event': {
      const event = item as EventFeedItem;
      return (
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.metadata.startDate).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {event.metadata.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{event.metadata.location}</span>
            </div>
          )}

          {event.metadata.maxParticipants && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>
                {event.metadata.currentParticipants}/{event.metadata.maxParticipants}
              </span>
            </div>
          )}

          {event.metadata.userHasRsvp && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Partecipo
            </Badge>
          )}
        </div>
      );
    }

    case 'marketplace': {
      const marketplace = item as MarketplaceFeedItem;
      return (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="text-2xl font-bold text-primary">
            €{marketplace.metadata.price.toFixed(2)}
          </div>

          <Badge variant="outline" className="capitalize">
            {marketplace.metadata.condition.replace('_', ' ')}
          </Badge>

          {marketplace.metadata.isSold && (
            <Badge variant="destructive">Venduto</Badge>
          )}

          {marketplace.metadata.isPrivate && (
            <Badge variant="secondary">Privato</Badge>
          )}
        </div>
      );
    }

    case 'proposal': {
      const proposal = item as ProposalFeedItem;
      return (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'text-lg font-bold',
                proposal.metadata.score > 0
                  ? 'text-green-600 dark:text-green-400'
                  : proposal.metadata.score < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
              )}
            >
              {proposal.metadata.score > 0 && '+'}
              {proposal.metadata.score}
            </div>
            <span className="text-sm text-muted-foreground">voti</span>
          </div>

          <Badge
            variant={
              proposal.metadata.status === 'approved'
                ? 'default'
                : proposal.metadata.status === 'declined'
                  ? 'destructive'
                  : 'secondary'
            }
            className="capitalize"
          >
            {proposal.metadata.status.replace('_', ' ')}
          </Badge>

          <div className="text-sm text-muted-foreground">
            {proposal.metadata.discussionCount} discussioni
          </div>
        </div>
      );
    }

    case 'announcement': {
      const announcement = item as AnnouncementFeedItem;
      return (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge
            variant={
              announcement.metadata.priority === 'urgent'
                ? 'destructive'
                : announcement.metadata.priority === 'high'
                  ? 'default'
                  : 'secondary'
            }
            className="gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {announcement.metadata.priority === 'urgent'
              ? 'Urgente'
              : announcement.metadata.priority === 'high'
                ? 'Priorità Alta'
                : 'Normale'}
          </Badge>

          {announcement.metadata.isPinned && (
            <Badge variant="outline">In evidenza</Badge>
          )}

          {announcement.metadata.expiresAt && (
            <div className="text-sm text-muted-foreground">
              Scade il{' '}
              {new Date(announcement.metadata.expiresAt).toLocaleDateString('it-IT')}
            </div>
          )}
        </div>
      );
    }
  }
}

/**
 * Unified Feed Card Component
 *
 * A Twitter/NextDoor-style card that displays different types of content:
 * - Events
 * - Marketplace items
 * - Proposals
 * - Announcements
 *
 * Follows the pattern from MarketplaceItemCard and ProposalCard
 *
 * @example
 * ```tsx
 * <UnifiedFeedCard
 *   item={feedItem}
 *   onLike={handleLike}
 *   onComment={handleComment}
 *   onShare={handleShare}
 * />
 * ```
 */
export function UnifiedFeedCard({
  item,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onCardClick,
  showActions = true,
  variant = 'desktop',
}: UnifiedFeedCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    if (!onLike) return;
    startTransition(() => {
      onLike(item.id);
    });
  };

  const handleComment = () => {
    if (!onComment) return;
    onComment(item.id);
  };

  const handleShare = () => {
    if (!onShare) return;
    startTransition(() => {
      onShare(item.id);
    });
  };

  const handleEdit = () => {
    if (!onEdit) return;
    onEdit(item.id);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
      startTransition(() => {
        onDelete(item.id);
      });
    }
  };

  const handleCardClick = () => {
    if (!onCardClick) return;
    onCardClick(item.id, item.type);
  };

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
    addSuffix: true,
    locale: it,
  });

  return (
    <Card
      className={cn(
        'border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm',
        variant === 'mobile' ? 'rounded-2xl' : 'rounded-3xl'
      )}
    >
      {/* Clickable area: Header + Content (excludes Footer to avoid conflicts with interactions) */}
      <div
        onClick={onCardClick ? handleCardClick : undefined}
        onKeyDown={(e) => {
          if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleCardClick();
          }
        }}
        role={onCardClick ? 'button' : undefined}
        tabIndex={onCardClick ? 0 : undefined}
        className={cn(
          onCardClick && 'cursor-pointer hover:bg-accent/50 transition-colors'
        )}
      >
        {/* Header: Avatar + Author + Timestamp + Actions */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                {item.author.avatar && (
                  <AvatarImage src={item.author.avatar} alt={item.author.name} />
                )}
                <AvatarFallback>{getInitials(item.author.name)}</AvatarFallback>
              </Avatar>

              {/* Author + Timestamp */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm truncate">
                    {item.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>

                {/* Type Badge */}
                <div className="mt-1">
                  <Badge variant={getTypeBadgeVariant(item.type)} className="gap-1">
                    {getTypeIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center shrink-0"
                    aria-label="Azioni"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifica
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        {/* Content: Category + Title + Description + Media + Metadata */}
        <CardContent className="space-y-3 pb-3">
          {/* Category Badge */}
          {item.category && (
            <Badge
              style={{
                backgroundColor: item.category.color || '#0891b2',
              }}
              className="text-white"
            >
              {item.category.name}
            </Badge>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.description}
          </p>

          {/* Media */}
          {renderMedia(item)}

          {/* Type-specific metadata */}
          {renderTypeSpecificMetadata(item)}
        </CardContent>
      </div>

      {/* Footer: Interaction Bar */}
      {showActions && (
        <CardFooter className="pt-3 border-t">
          <InteractionBar
            likes={item.interactions.likes}
            comments={item.interactions.comments}
            shares={item.interactions.shares}
            views={item.interactions.views}
            onLike={onLike ? handleLike : undefined}
            onComment={onComment ? handleComment : undefined}
            onShare={onShare ? handleShare : undefined}
            isPending={isPending}
          />
        </CardFooter>
      )}
    </Card>
  );
}
