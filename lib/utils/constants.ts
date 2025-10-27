/**
 * Costanti dell'applicazione
 */

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || 'Community Prato Rinaldo';

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const TENANT_SLUG =
  process.env.NEXT_PUBLIC_TENANT_SLUG || 'prato-rinaldo';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  ONBOARDING: '/onboarding',
  PROFILE: '/profile',
  ADMIN: '/admin',

  // Public routes
  EVENTS: '/events',
  MARKETPLACE: '/marketplace',
  COMMUNITY_PRO: '/community-pro',
  FEED: '/feed', // Bacheca pubblica

  // Private routes (verified residents only)
  AGORA: '/agora',
  AGORA_ROADMAP: '/agora/roadmap',
  RESOURCES: '/resources',
  BACHECA: '/bacheca', // Bacheca personale
} as const;

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

// Committee roles
export const COMMITTEE_ROLES = {
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  SECRETARY: 'secretary',
  TREASURER: 'treasurer',
  BOARD_MEMBER: 'board_member',
  COUNCIL_MEMBER: 'council_member',
} as const;

// Verification statuses
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Content statuses
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Marketplace statuses
export const MARKETPLACE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SOLD: 'sold',
  REJECTED: 'rejected',
} as const;

// Moderation statuses
export const MODERATION_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Proposal statuses (Agorà)
export const PROPOSAL_STATUS = {
  PROPOSED: 'proposed',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
} as const;

// Service profile types (Community Pro)
export const SERVICE_PROFILE_TYPE = {
  VOLUNTEER: 'volunteer',
  PROFESSIONAL: 'professional',
} as const;
