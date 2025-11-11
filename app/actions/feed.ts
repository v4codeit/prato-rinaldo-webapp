'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  UnifiedFeedItem,
  EventFeedItem,
  MarketplaceFeedItem,
  ProposalFeedItem,
  FeedResponse,
  FeedParams,
} from '@/types/feed';

// =====================================================
// TRANSFORMER FUNCTIONS
// =====================================================

/**
 * Transform events to unified feed items
 */
function transformEventsToFeedItems(events: any[]): EventFeedItem[] {
  return events.map((event) => ({
    id: event.id,
    type: 'event' as const,
    title: event.title,
    description: event.description,
    author: {
      id: event.organizer?.id || event.organizer_id,
      name: event.organizer?.name || 'Organizzatore',
      avatar: event.organizer?.avatar || null,
    },
    category: event.category ? {
      id: event.category.id,
      name: event.category.name,
      slug: event.category.slug,
      icon: null,
      color: '#3b82f6', // Default blue for events
    } : {
      id: 'event-default',
      name: 'Evento',
      slug: 'event',
      icon: null,
      color: '#3b82f6',
    },
    timestamp: event.created_at,
    coverImage: event.cover_image || null, // Top-level field, not in metadata
    interactions: {
      likes: 0, // TODO: implement real likes
      comments: 0, // TODO: implement real comments
      shares: 0, // Required field
    },
    metadata: {
      startDate: event.start_date,
      endDate: event.end_date || null,
      location: event.location || null,
      maxParticipants: event.max_attendees || null,
      currentParticipants: event.rsvp_count || 0,
      isRsvpRequired: true, // TODO: add requires_rsvp field to events table
      status: event.status,
      // Note: userHasRsvp is optional and should be added when user context is available
    },
  }));
}

/**
 * Transform marketplace items to unified feed items
 */
function transformMarketplaceToFeedItems(items: any[]): MarketplaceFeedItem[] {
  return items.map((item) => ({
    id: item.id,
    type: 'marketplace' as const,
    title: item.title,
    description: item.description,
    author: {
      id: item.seller?.id || item.seller_id,
      name: item.seller?.name || 'Venditore',
      avatar: item.seller?.avatar || null,
    },
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
      slug: item.category.slug,
      icon: null,
      color: '#10b981', // Default green for marketplace
    } : {
      id: 'marketplace-default',
      name: 'Marketplace',
      slug: 'marketplace',
      icon: null,
      color: '#10b981',
    },
    timestamp: item.created_at,
    coverImage: (item.images && item.images[0]) || null, // First image as cover, top-level field
    interactions: {
      likes: 0, // TODO: implement real likes
      comments: 0, // TODO: implement real comments
      shares: 0, // Required field
    },
    metadata: {
      price: item.price || 0,
      condition: item.condition,
      isSold: item.is_sold || false,
      isPrivate: item.is_private || false,
      images: item.images || [],
      status: item.status,
    },
  }));
}

/**
 * Transform proposals to unified feed items
 */
function transformProposalsToFeedItems(proposals: any[]): ProposalFeedItem[] {
  return proposals.map((proposal) => ({
    id: proposal.id,
    type: 'proposal' as const,
    title: proposal.title,
    description: proposal.description,
    author: {
      id: proposal.author?.id || proposal.author_id,
      name: proposal.author?.name || 'Autore',
      avatar: proposal.author?.avatar || null,
    },
    category: proposal.category ? {
      id: proposal.category.id,
      name: proposal.category.name,
      slug: proposal.category.slug || 'proposal',
      icon: proposal.category.icon || null,
      color: proposal.category.color || '#8b5cf6', // Default purple for proposals
    } : {
      id: 'proposal-default',
      name: 'Proposta',
      slug: 'proposal',
      icon: null,
      color: '#8b5cf6',
    },
    timestamp: proposal.created_at,
    coverImage: null, // Proposals don't have cover images
    interactions: {
      likes: proposal.upvotes || 0, // Use upvotes as likes for proposals
      comments: 0, // TODO: implement real comments count
      shares: 0, // Required field
    },
    metadata: {
      status: proposal.status,
      upvotes: proposal.upvotes || 0,
      downvotes: proposal.downvotes || 0,
      score: proposal.score || ((proposal.upvotes || 0) - (proposal.downvotes || 0)),
      discussionCount: 0, // TODO: implement discussion/comments system
      // Note: userVote is optional and should be added when user context is available
    },
  }));
}

// =====================================================
// PUBLIC FEED - Accessible to all users
// =====================================================

/**
 * Get public feed (events + marketplace only)
 * Accessible to all users, including non-authenticated
 *
 * @param params - Filter and pagination parameters
 * @returns Unified feed items with pagination info
 */
export async function getPublicFeed(params: FeedParams = {}): Promise<FeedResponse> {
  const supabase = await createClient();

  const {
    limit = 20,
    offset = 0,
    type = 'all',
    sortBy = 'newest',
  } = params;

  try {
    // Parallel fetch from multiple sources
    const fetchPromises = [];

    // Fetch public events (upcoming only)
    if (type === 'all' || type === 'event') {
      fetchPromises.push(
        supabase
          .from('events')
          .select(`
            *,
            category:categories(id, name, slug),
            organizer:users!organizer_id (
              id,
              name,
              avatar
            )
          `)
          .eq('status', 'published')
          .eq('is_private', false)
          .gte('end_date', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(type === 'event' ? limit : 100)
      );
    }

    // Fetch public marketplace items (not sold)
    if (type === 'all' || type === 'marketplace') {
      fetchPromises.push(
        supabase
          .from('marketplace_items')
          .select(`
            *,
            category:categories(id, name, slug),
            seller:users!seller_id (
              id,
              name,
              avatar
            )
          `)
          .eq('status', 'approved')
          .eq('is_private', false)
          .eq('is_sold', false)
          .order('created_at', { ascending: false })
          .limit(type === 'marketplace' ? limit : 100)
      );
    }

    // NOTE: Proposals are NOT included in public feed
    // They are only accessible in private feed for verified residents
    // TODO: If public proposals are needed in future, add fetch here

    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises);

    // Transform results
    const allItems: UnifiedFeedItem[] = [];
    let resultIndex = 0;

    if (type === 'all' || type === 'event') {
      const eventsResult = results[resultIndex++];
      if (eventsResult.data && !eventsResult.error) {
        allItems.push(...transformEventsToFeedItems(eventsResult.data));
      }
    }

    if (type === 'all' || type === 'marketplace') {
      const marketplaceResult = results[resultIndex++];
      if (marketplaceResult.data && !marketplaceResult.error) {
        allItems.push(...transformMarketplaceToFeedItems(marketplaceResult.data));
      }
    }

    // Sort items
    const sortedItems = sortFeedItems(allItems, sortBy);

    // Apply pagination
    const paginatedItems = sortedItems.slice(offset, offset + limit);
    const hasMore = sortedItems.length > offset + limit;

    return {
      feedItems: paginatedItems,
      hasMore,
      total: sortedItems.length,
    };

  } catch (error) {
    console.error('[Feed] Error fetching public feed:', error);
    return {
      feedItems: [],
      hasMore: false,
      total: 0,
    };
  }
}

// =====================================================
// PRIVATE FEED - Verified residents only
// =====================================================

/**
 * Get private feed (events + marketplace + proposals)
 * Accessible only to verified residents
 * Includes private events, private marketplace items, and agora proposals
 *
 * @param params - Filter and pagination parameters
 * @returns Unified feed items with pagination info
 */
export async function getPrivateFeed(params: FeedParams = {}): Promise<FeedResponse> {
  const supabase = await createClient();

  const {
    limit = 20,
    offset = 0,
    type = 'all',
    sortBy = 'newest',
  } = params;

  try {
    // Check user authentication and verification status
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - return empty feed
      return {
        feedItems: [],
        hasMore: false,
        total: 0,
      };
    }

    // Check if user is verified resident
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    const isVerifiedResident = profile?.verification_status === 'approved';

    if (!isVerifiedResident) {
      // Not verified - return public feed only
      return getPublicFeed(params);
    }

    // Parallel fetch from multiple sources
    const fetchPromises = [];

    // Fetch ALL events (public + private)
    if (type === 'all' || type === 'event') {
      fetchPromises.push(
        supabase
          .from('events')
          .select(`
            *,
            category:categories(id, name, slug),
            organizer:users!organizer_id (
              id,
              name,
              avatar
            )
          `)
          .eq('status', 'published')
          .gte('end_date', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(type === 'event' ? limit : 100)
      );
    }

    // Fetch ALL marketplace items (public + private, not sold)
    if (type === 'all' || type === 'marketplace') {
      fetchPromises.push(
        supabase
          .from('marketplace_items')
          .select(`
            *,
            category:categories(id, name, slug),
            seller:users!seller_id (
              id,
              name,
              avatar
            )
          `)
          .eq('status', 'approved')
          .eq('is_sold', false)
          .order('created_at', { ascending: false })
          .limit(type === 'marketplace' ? limit : 100)
      );
    }

    // Fetch proposals (agora proposals for verified residents)
    if (type === 'all' || type === 'proposal') {
      fetchPromises.push(
        supabase
          .from('proposals')
          .select(`
            *,
            author:users!author_id (
              id,
              name,
              avatar
            ),
            category:proposal_categories!category_id (
              id,
              name,
              icon,
              color
            )
          `)
          .order('created_at', { ascending: false })
          .limit(type === 'proposal' ? limit : 100)
      );
    }

    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises);

    // Transform results
    const allItems: UnifiedFeedItem[] = [];
    let resultIndex = 0;

    if (type === 'all' || type === 'event') {
      const eventsResult = results[resultIndex++];
      if (eventsResult.data && !eventsResult.error) {
        allItems.push(...transformEventsToFeedItems(eventsResult.data));
      }
    }

    if (type === 'all' || type === 'marketplace') {
      const marketplaceResult = results[resultIndex++];
      if (marketplaceResult.data && !marketplaceResult.error) {
        allItems.push(...transformMarketplaceToFeedItems(marketplaceResult.data));
      }
    }

    if (type === 'all' || type === 'proposal') {
      const proposalsResult = results[resultIndex++];
      if (proposalsResult.data && !proposalsResult.error) {
        allItems.push(...transformProposalsToFeedItems(proposalsResult.data));
      }
    }

    // Sort items
    const sortedItems = sortFeedItems(allItems, sortBy);

    // Apply pagination
    const paginatedItems = sortedItems.slice(offset, offset + limit);
    const hasMore = sortedItems.length > offset + limit;

    return {
      feedItems: paginatedItems,
      hasMore,
      total: sortedItems.length,
    };

  } catch (error) {
    console.error('[Feed] Error fetching private feed:', error);
    return {
      feedItems: [],
      hasMore: false,
      total: 0,
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Sort feed items by specified criteria
 *
 * @param items - Array of unified feed items
 * @param sortBy - Sort criteria ('newest' or 'popular')
 * @returns Sorted array of feed items
 */
function sortFeedItems(items: UnifiedFeedItem[], sortBy: 'newest' | 'popular'): UnifiedFeedItem[] {
  if (sortBy === 'popular') {
    // Sort by likes/upvotes/score descending, then by timestamp descending
    return [...items].sort((a, b) => {
      const likesA = a.interactions.likes;
      const likesB = b.interactions.likes;

      if (likesA !== likesB) {
        return likesB - likesA; // Higher likes first
      }

      // If likes are equal, sort by newest
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  // Default: sort by newest (timestamp descending)
  return [...items].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get feed item by ID and type
 * Useful for navigating to detail pages
 *
 * @param id - Item ID
 * @param type - Item type
 * @returns Feed item or null if not found
 */
export async function getFeedItemById(
  id: string,
  type: 'event' | 'marketplace' | 'proposal'
): Promise<UnifiedFeedItem | null> {
  const supabase = await createClient();

  try {
    switch (type) {
      case 'event': {
        const { data } = await supabase
          .from('events')
          .select(`
            *,
            category:categories(id, name, slug),
            organizer:users!organizer_id (
              id,
              name,
              avatar
            )
          `)
          .eq('id', id)
          .single();

        return data ? transformEventsToFeedItems([data])[0] : null;
      }

      case 'marketplace': {
        const { data } = await supabase
          .from('marketplace_items')
          .select(`
            *,
            category:categories(id, name, slug),
            seller:users!seller_id (
              id,
              name,
              avatar
            )
          `)
          .eq('id', id)
          .single();

        return data ? transformMarketplaceToFeedItems([data])[0] : null;
      }

      case 'proposal': {
        const { data } = await supabase
          .from('proposals')
          .select(`
            *,
            author:users!author_id (
              id,
              name,
              avatar
            ),
            category:proposal_categories!category_id (
              id,
              name,
              icon,
              color
            )
          `)
          .eq('id', id)
          .single();

        return data ? transformProposalsToFeedItems([data])[0] : null;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`[Feed] Error fetching ${type} item:`, error);
    return null;
  }
}

// =====================================================
// TODO: FUTURE ENHANCEMENTS
// =====================================================

/**
 * TODO: Implement real-time likes/reactions system
 * - Add likes/reactions table in database
 * - Implement addLike/removeLike actions
 * - Update interactions.likes count in feed items
 * - Add realtime subscriptions for live updates
 */

/**
 * TODO: Implement comments system
 * - Add comments table with polymorphic relationship (content_type + content_id)
 * - Implement getComments/addComment/deleteComment actions
 * - Update interactions.comments count in feed items
 * - Add realtime subscriptions for live comment updates
 */

/**
 * TODO: Consider implementing advertisements in feed
 * - Add advertisements table
 * - Mix ads into feed at specific intervals (every N items)
 * - Only show ads in public feed, not private feed
 * - Track ad impressions and clicks
 */

/**
 * TODO: Implement feed caching strategy
 * - Cache public feed for 5 minutes (high traffic)
 * - Cache private feed per-user for 1 minute
 * - Invalidate cache on new content creation
 * - Use Redis or Upstash for caching layer
 */

/**
 * TODO: Add infinite scroll support
 * - Add cursor-based pagination (instead of offset)
 * - Return nextCursor in FeedResponse
 * - More efficient for large datasets
 */

/**
 * TODO: Add feed filtering by category
 * - Add categoryId parameter to FeedParams
 * - Filter items by category across all types
 * - Useful for topic-specific feeds
 */

/**
 * WARNING: Public proposals not currently implemented
 * - Proposals table exists but feed logic treats all as private
 * - If public proposals are needed, add is_private column to proposals table
 * - Update getPublicFeed to include public proposals
 * - Update transformer to handle proposal privacy
 */
