/**
 * Types for the unified feed system
 * Combines events, marketplace, proposals, and announcements into a Twitter/NextDoor-style feed
 */

// ============================================================================
// Feed Item Types
// ============================================================================

/**
 * Types of content that can appear in the unified feed
 * NOTE: 'marketplace' is kept for backward compatibility, will be removed in future
 */
export type FeedItemType = 'event' | 'mercatino' | 'marketplace' | 'proposal' | 'announcement';

/**
 * Author information shared across all feed items
 */
export interface FeedAuthor {
  id: string;
  name: string;
  avatar?: string | null;
}

/**
 * Interaction counts shared across all feed items
 */
export interface FeedInteractions {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
}

/**
 * Base interface for all feed items with common properties
 */
export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  author: FeedAuthor;
  timestamp: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  interactions: FeedInteractions;
  coverImage?: string | null;
}

// ============================================================================
// Type-Specific Feed Items
// ============================================================================

/**
 * Event-specific metadata for feed items
 */
export interface EventFeedItem extends BaseFeedItem {
  type: 'event';
  metadata: {
    startDate: string;
    endDate: string | null;
    location: string | null;
    maxParticipants: number | null;
    currentParticipants: number;
    isRsvpRequired: boolean;
    userHasRsvp?: boolean;
    status: 'draft' | 'published' | 'cancelled';
  };
}

/**
 * Mercatino/Marketplace item-specific metadata for feed items
 * NOTE: type accepts both 'mercatino' and 'marketplace' for backward compatibility
 */
export interface MercatinoFeedItem extends BaseFeedItem {
  type: 'mercatino' | 'marketplace';
  metadata: {
    price: number;
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    isSold: boolean;
    isPrivate: boolean;
    images: string[];
    status: 'pending' | 'approved' | 'rejected';

    // Nuovi campi Mercatino (opzionali per retrocompatibilità)
    listingType?: 'real_estate' | 'objects';
    realEstateType?: 'rent' | 'sale' | null;
    objectType?: 'sale' | 'gift' | null;

    // Campi immobiliari (opzionali)
    squareMeters?: number;
    rooms?: number;
    floor?: number;
    hasElevator?: boolean;
    hasGarage?: boolean;
    addressZone?: string;

    // Donazione (opzionale per retrocompatibilità)
    hasDonated?: boolean;

    // Statistiche (opzionale per retrocompatibilità)
    viewCount?: number;

    // Categoria (opzionale per retrocompatibilità)
    categoryId?: string | null;
    categoryName?: string | null;
  };
}

/** @deprecated Use MercatinoFeedItem instead */
export type MarketplaceFeedItem = MercatinoFeedItem;

/**
 * Proposal-specific metadata for feed items
 */
export interface ProposalFeedItem extends BaseFeedItem {
  type: 'proposal';
  metadata: {
    status: 'proposed' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'declined';
    upvotes: number;
    score: number;
    hasVoted?: boolean;
    discussionCount: number;
  };
}

/**
 * Announcement-specific metadata for feed items
 */
export interface AnnouncementFeedItem extends BaseFeedItem {
  type: 'announcement';
  metadata: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isPinned: boolean;
    expiresAt: string | null;
    attachments?: string[];
    authorRole: 'admin' | 'super_admin' | 'moderator';
  };
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union type representing any type of feed item
 */
export type UnifiedFeedItem =
  | EventFeedItem
  | MercatinoFeedItem
  | ProposalFeedItem
  | AnnouncementFeedItem;

// ============================================================================
// Filter & Sort Types
// ============================================================================

/**
 * Filter options for the unified feed
 */
export interface FeedFilters {
  types?: FeedItemType[];
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
  search?: string;
}

/**
 * Sort options for the unified feed
 */
export type FeedSortOption = 'newest' | 'popular' | 'trending' | 'relevant';

/**
 * Feed pagination configuration
 */
export interface FeedPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Response from feed queries
 */
export interface FeedResponse {
  feedItems: UnifiedFeedItem[];
  hasMore: boolean;
  total: number;
}

/**
 * Parameters for feed queries (extends filters with pagination and sorting)
 */
export interface FeedParams extends FeedFilters {
  limit?: number;
  offset?: number;
  type?: 'all' | FeedItemType;
  sortBy?: 'newest' | 'popular';
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the unified feed card component
 */
export interface UnifiedFeedCardProps {
  item: UnifiedFeedItem;
  onLike?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onCardClick?: (id: string, type: FeedItemType) => void;
  showActions?: boolean;
  variant?: 'mobile' | 'desktop';
}

/**
 * Props for the interaction bar component
 */
export interface InteractionBarProps {
  likes: number;
  comments: number;
  shares?: number;
  views?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  isPending?: boolean;
  showLabels?: boolean;
  className?: string;
}

/**
 * Props for feed container component
 */
export interface FeedContainerProps {
  items: UnifiedFeedItem[];
  filters?: FeedFilters;
  sortBy?: FeedSortOption;
  pagination?: FeedPagination;
  onFilterChange?: (filters: FeedFilters) => void;
  onSortChange?: (sortBy: FeedSortOption) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * Feed action types for Server Actions
 */
export type FeedAction =
  | { type: 'like'; itemId: string; itemType: FeedItemType }
  | { type: 'unlike'; itemId: string; itemType: FeedItemType }
  | { type: 'comment'; itemId: string; itemType: FeedItemType; content: string }
  | { type: 'share'; itemId: string; itemType: FeedItemType }
  | { type: 'delete'; itemId: string; itemType: FeedItemType };

/**
 * Response from feed actions
 */
export interface FeedActionResponse {
  success: boolean;
  error?: string;
  data?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
}
