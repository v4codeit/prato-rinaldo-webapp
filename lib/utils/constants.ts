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
  PROFILE: '/bacheca',  // Dashboard personale (era redirect da /profile)
  SETTINGS: '/settings',
  ADMIN: '/admin',

  // Admin routes
  ADMIN_USERS: '/admin/users',
  ADMIN_MODERATION: '/admin/moderation',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_SETTINGS: '/admin/settings',

  // Public routes
  EVENTS: '/events',
  MERCATINO: '/mercatino',
  /** @deprecated Use MERCATINO instead */
  MARKETPLACE: '/mercatino',
  COMMUNITY_PRO: '/community-pro',
  COMMUNITY_PRO_APPLY: '/community-pro/apply',
  COMMUNITY_PRO_APPLY_VOLUNTEER: '/community-pro/apply/volunteer',
  COMMUNITY_PRO_APPLY_PROFESSIONAL: '/community-pro/apply/professional',
  FEED: '/feed', // Bacheca pubblica
  ARTICLES: '/articles', // Articoli
  CONTACTS: '/contacts', // Contatti

  // Private routes (verified residents only)
  AGORA: '/agora',
  RESOURCES: '/resources',
  BACHECA: '/bacheca', // Bacheca personale
  MIO_CONDOMINIO: '/mio-condominio', // Integrazione MioCondominio

  // Community (Topics system - Telegram-style chat)
  COMMUNITY: '/community',
  ADMIN_COMMUNITY: '/admin/community',
  ADMIN_RESIDENTS_MAP: '/admin/residents-map',
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

// Notification types (In-App Notification System)
export const NOTIFICATION_TYPES = {
  USER_REGISTRATION: 'user_registration',
  USER_APPROVED: 'user_approved',
  USER_REJECTED: 'user_rejected',
  PROPOSAL_NEW: 'proposal_new',
  PROPOSAL_STATUS: 'proposal_status',
  EVENT_REMINDER: 'event_reminder',
  MERCATINO_NEW: 'mercatino_new',
  /** @deprecated Use MERCATINO_NEW instead */
  MARKETPLACE_NEW: 'mercatino_new',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
} as const;

// Notification statuses
export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ACTION_PENDING: 'action_pending',
  ACTION_COMPLETED: 'action_completed',
  ARCHIVED: 'archived',
} as const;

// Content statuses
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Mercatino statuses (ex-Marketplace)
export const MERCATINO_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SOLD: 'sold',
  REJECTED: 'rejected',
} as const;

/** @deprecated Use MERCATINO_STATUS instead */
export const MARKETPLACE_STATUS = MERCATINO_STATUS;

// Mercatino listing types
export const MERCATINO_LISTING_TYPE = {
  REAL_ESTATE: 'real_estate',
  OBJECTS: 'objects',
} as const;

// Mercatino real estate types
export const MERCATINO_REAL_ESTATE_TYPE = {
  RENT: 'rent',
  SALE: 'sale',
} as const;

// Mercatino object types
export const MERCATINO_OBJECT_TYPE = {
  SALE: 'sale',
  GIFT: 'gift',
} as const;

// Mercatino contact methods
export const MERCATINO_CONTACT_METHOD = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  TELEGRAM: 'telegram',
  PHONE: 'phone',
} as const;

// Mercatino conditions
export const MERCATINO_CONDITION = {
  NEW: 'new',
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const;

// Mercatino condition labels (Italian)
export const MERCATINO_CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  like_new: 'Come nuovo',
  good: 'Buono',
  fair: 'Discreto',
  poor: 'Da riparare',
} as const;

// Mercatino listing type labels (Italian)
export const MERCATINO_LISTING_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Immobile',
  objects: 'Oggetto',
} as const;

// Mercatino real estate type labels (Italian)
export const MERCATINO_REAL_ESTATE_TYPE_LABELS: Record<string, string> = {
  rent: 'Affitto',
  sale: 'Vendita',
} as const;

// Mercatino object type labels (Italian)
export const MERCATINO_OBJECT_TYPE_LABELS: Record<string, string> = {
  sale: 'Vendita',
  gift: 'Regalo',
} as const;

// Mercatino contact method labels (Italian)
export const MERCATINO_CONTACT_METHOD_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  telegram: 'Telegram',
  phone: 'Telefono',
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

// ============ MERCATINO DONATION SYSTEM ============

// Donation preset amounts (in cents)
export const MERCATINO_DONATION_PRESETS = [
  { cents: 100, label: '1€' },
  { cents: 200, label: '2€' },
  { cents: 500, label: '5€' },
  { cents: 1000, label: '10€' },
] as const;

// Minimum donation amount (in cents) - 1€
export const MERCATINO_MIN_DONATION_CENTS = 100;

// Maximum images per listing
export const MERCATINO_MAX_IMAGES = 6;

// Maximum file size for images (in MB)
export const MERCATINO_MAX_FILE_SIZE_MB = 10;

// Maximum file size for images (in bytes)
export const MERCATINO_MAX_FILE_SIZE_BYTES = MERCATINO_MAX_FILE_SIZE_MB * 1024 * 1024;

// Default placeholder image for items without images
export const MERCATINO_DEFAULT_IMAGE = '/assets/images/placeholder-product.png';
