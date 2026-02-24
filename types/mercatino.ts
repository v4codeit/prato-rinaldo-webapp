/**
 * Mercatino Types
 * Unified type definitions for the Mercatino (marketplace) system
 */

// ============ ENUMS & CONSTANTS ============

export const MERCATINO_LISTING_TYPES = ['objects', 'real_estate'] as const;
export type MercatinoListingType = (typeof MERCATINO_LISTING_TYPES)[number];

export const MERCATINO_OBJECT_TYPES = ['sale', 'gift'] as const;
export type MercatinoObjectType = (typeof MERCATINO_OBJECT_TYPES)[number];

export const MERCATINO_REAL_ESTATE_TYPES = ['sale', 'rent'] as const;
export type MercatinoRealEstateType = (typeof MERCATINO_REAL_ESTATE_TYPES)[number];

export const MERCATINO_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
export type MercatinoCondition = (typeof MERCATINO_CONDITIONS)[number];

export const MERCATINO_CONTACT_METHODS = ['whatsapp', 'email', 'telegram', 'phone'] as const;
export type MercatinoContactMethod = (typeof MERCATINO_CONTACT_METHODS)[number];

export const MERCATINO_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type MercatinoStatus = (typeof MERCATINO_STATUSES)[number];

// ============ DONATION SYSTEM ============

export interface DonationPreset {
  cents: number;
  label: string;
}

export const DONATION_PRESETS: DonationPreset[] = [
  { cents: 100, label: '1€' },
  { cents: 200, label: '2€' },
  { cents: 500, label: '5€' },
  { cents: 1000, label: '10€' },
];

export const MIN_DONATION_CENTS = 100; // 1€ minimum
export const MAX_IMAGES = 6;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============ WIZARD DATA TYPES ============

export interface WizardStep1Data {
  listingType: MercatinoListingType;
  objectType?: MercatinoObjectType | null;
  realEstateType?: MercatinoRealEstateType | null;
}

export interface WizardStep2BaseData {
  title: string;
  description: string;
  price: number;
}

export interface WizardStep2ObjectData extends WizardStep2BaseData {
  categoryId: string; // Required for objects
  condition: MercatinoCondition;
}

export interface WizardStep2RealEstateData extends WizardStep2BaseData {
  propertyType: string;
  squareMeters: number;
  rooms: number;
  bathrooms?: number;
  floor?: number;
  hasGarden?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  energyClass?: string;
  address?: string;
}

export interface WizardStep3Data {
  images: string[];
}

export interface ContactMethodEntry {
  method: MercatinoContactMethod;
  value: string;
}

export interface WizardStep4Data {
  contactMethods: ContactMethodEntry[];
}

export interface WizardStep5Data {
  agreeToTerms: boolean;
  wantsToDonate: boolean;
  donationAmountCents: number; // In cents (100 = 1€)
}

export interface MercatinoWizardData {
  step1: WizardStep1Data;
  step2: WizardStep2ObjectData | WizardStep2RealEstateData;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  step5: WizardStep5Data;
}

// ============ CATEGORY TYPE ============

export interface MercatinoCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
}

// ============ DATABASE/API TYPES ============

export interface MercatinoItem {
  id: string;
  title: string;
  description: string;
  price: number;
  listing_type: MercatinoListingType;
  object_type?: MercatinoObjectType | null;
  real_estate_type?: MercatinoRealEstateType | null;
  category_id?: string | null;
  condition?: MercatinoCondition | null;
  images: string[];
  contact_methods: ContactMethodEntry[];
  seller_id: string;
  tenant_id: string;
  status: MercatinoStatus;
  is_sold: boolean;
  is_private: boolean;
  has_donated: boolean;
  donation_amount_cents?: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  seller?: {
    id: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  category?: MercatinoCategory | null;
}

// ============ FEED ITEM TYPE (for unified feed) ============

export interface MercatinoFeedItem {
  id: string;
  type: 'mercatino';
  title: string;
  description?: string;
  price: number;
  listingType: MercatinoListingType;
  objectType?: MercatinoObjectType | null;
  realEstateType?: MercatinoRealEstateType | null;
  condition?: MercatinoCondition | null;
  categoryId?: string | null;
  categoryName?: string | null;
  images: string[];
  hasDonated: boolean;
  donationAmountCents?: number | null;
  viewCount: number;
  isSold: boolean;
  metadata: {
    seller: {
      id: string;
      name?: string | null;
      email?: string | null;
      avatar?: string | null;
    };
    createdAt: string;
  };
}

// ============ UI OPTION TYPES ============

export interface ListingTypeOption {
  value: MercatinoListingType;
  label: string;
  description: string;
  icon: string;
  color: 'emerald' | 'blue';
}

export interface ObjectTypeOption {
  value: MercatinoObjectType;
  label: string;
  description: string;
  icon: string;
}

export interface RealEstateTypeOption {
  value: MercatinoRealEstateType;
  label: string;
  description: string;
  icon: string;
}

export interface ConditionOption {
  value: MercatinoCondition;
  label: string;
  description?: string;
}

export interface ContactMethodOption {
  method: MercatinoContactMethod;
  label: string;
  icon: string;
  placeholder: string;
  validation: (value: string) => boolean;
}

// ============ CREATE/UPDATE RESPONSE ============

export interface MercatinoCreateResult {
  success: boolean;
  itemId?: string;
  error?: string;
  requiresDonation?: boolean;
  donationAmountCents?: number;
}

export interface MercatinoUpdateResult {
  success: boolean;
  error?: string;
  message?: string;
}
