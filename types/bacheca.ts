/**
 * Types for the unified Bacheca (Dashboard) system
 * Combines user profile, marketplace, proposals, professional profile, and badges
 */

import type { UnifiedFeedItem } from './feed';

// ============================================================================
// Statistics & Overview
// ============================================================================

/**
 * Simplified BachecaStats - Only used for tab badges
 * Removed complex nested stats that were only used in removed StatsGrid
 */
export interface BachecaStats {
  marketplace: {
    total: number;
  };
  proposals: {
    total: number;
  };
}

/**
 * User Points and Level Stats
 * Standalone interface used by LevelBanner and ProfileSection
 */
export interface PointsStats {
  total: number;
  level: number;
}

/**
 * Professional Profile Stats
 * Standalone interface used by ProfessionalSection
 */
export interface ProfessionalStats {
  exists: boolean;
  status: string | null;
  reviewsCount: number;
}

// ============================================================================
// Tab Data Types
// ============================================================================

/**
 * Marketplace Item with extended info for management
 * NOTE: description and condition are nullable in the database schema
 */
export interface MarketplaceItemWithActions {
  id: string;
  title: string;
  description: string | null;
  price: number;
  images: string[] | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  condition: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_sold: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  seller_id: string;
}

/**
 * Proposal with extended info for management
 * NOTE: status matches database enum proposal_status
 */
export interface ProposalWithActions {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  status: 'proposed' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'declined';
  upvotes: number;
  downvotes: number;
  score: number | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

/**
 * Professional Profile with extended info
 */
export interface ProfessionalProfileWithActions {
  id: string;
  user_id: string;
  tenant_id: string;
  business_name: string;
  category: string;
  description: string;
  services: string[];
  certifications: string[];
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'rejected';
  logo_url: string | null;
  portfolio_images: string[];
  profile_type: 'professional' | 'volunteer';
  created_at: string;
  updated_at: string;
}

/**
 * User Badge with badge details
 * NOTE: description and icon are nullable in the database
 */
export interface UserBadgeWithDetails {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    points: number;
  };
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface MarketplaceFilters {
  category?: string;
  condition?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  is_sold?: boolean;
  price_min?: number;
  price_max?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ProposalsFilters {
  category?: string;
  status?: 'proposed' | 'under_review' | 'approved' | 'declined' | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'title' | 'score';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Tab System Types
// ============================================================================

export type BachecaTab = 'overview' | 'marketplace' | 'proposte' | 'professionale' | 'profilo';

export interface TabConfig {
  value: BachecaTab;
  label: string;
  icon: string;
  count?: number;
  disabled?: boolean;
}

// ============================================================================
// User Profile Types
// ============================================================================

/**
 * User Profile for bacheca display
 * NOTE: Matches the return type of getCurrentUser() in users.ts
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  phone: string | null;
  role: string;
  admin_role: string | null;
  committee_role: string | null;
  verification_status: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Action Menu Types
// ============================================================================

export interface QuickAction {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

// ============================================================================
// Mobile-specific Types
// ============================================================================

export interface MobileCardProps {
  item: MarketplaceItemWithActions | ProposalWithActions;
  actions: QuickAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface BachecaClientProps {
  initialTab?: BachecaTab;
  stats: BachecaStats;
  marketplaceItems: MarketplaceItemWithActions[];
  proposals: ProposalWithActions[];
  professional: ProfessionalProfileWithActions | null;
  professionalStats: ProfessionalStats;
  userProfile: UserProfile;
  badges: UserBadgeWithDetails[];
  points: PointsStats;
  feedItems: UnifiedFeedItem[];
  feedHasMore: boolean;
  feedTotal: number;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface FilterBarProps {
  filters: MarketplaceFilters | ProposalsFilters;
  onFilterChange: (filters: MarketplaceFilters | ProposalsFilters) => void;
  categories?: Array<{ id: string; name: string }>;
  showAdvanced?: boolean;
}

export interface ItemCardProps {
  item: MarketplaceItemWithActions;
  onEdit: () => void;
  onDelete: () => void;
  onMarkSold: () => void;
  variant?: 'mobile' | 'desktop';
}

export interface ProposalCardProps {
  proposal: ProposalWithActions;
  onEdit: () => void;
  onDelete: () => void;
  variant?: 'mobile' | 'desktop';
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
