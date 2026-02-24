'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  mercatinoWizardStep1Schema,
  mercatinoWizardStep2ObjectSchema,
  mercatinoWizardStep2RealEstateSchema,
  mercatinoWizardStep4Schema,
  mercatinoWizardStep5Schema,
} from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import type {
  MercatinoListingType,
  MercatinoRealEstateType,
  MercatinoObjectType,
  MercatinoContactMethod,
  MercatinoCondition,
  MercatinoStatus,
} from '@/types/bacheca';

// ============================================================================
// Types
// ============================================================================

interface MercatinoItemBase {
  id: string;
  title: string;
  description: string | null;
  price: number;
  images: string[] | null;
  category_id: string | null;
  condition: MercatinoCondition | string | null;
  status: MercatinoStatus;
  is_sold: boolean;
  is_private: boolean;
  seller_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  // New Mercatino fields
  listing_type: MercatinoListingType;
  real_estate_type: MercatinoRealEstateType | null;
  object_type: MercatinoObjectType | null;
  square_meters: number | null;
  rooms: number | null;
  floor: number | null;
  has_elevator: boolean | null;
  has_garage: boolean | null;
  construction_year: number | null;
  address_zone: string | null;
  contact_methods: MercatinoContactMethod[];
  has_donated: boolean;
  donation_amount: number;
  donated_at: string | null;
  view_count: number;
}

interface MercatinoItemWithRelations extends MercatinoItemBase {
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  seller: {
    id: string;
    name: string;
    avatar: string | null;
    bio?: string | null;
  };
}

// ============================================================================
// Wizard Data Types (Multi-step form)
// ============================================================================

export interface WizardStep1Data {
  listingType: MercatinoListingType;
  realEstateType?: MercatinoRealEstateType;
  objectType?: MercatinoObjectType;
}

export interface WizardStep2ObjectData {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  condition: MercatinoCondition;
  isPrivate: boolean;
}

export interface WizardStep2RealEstateData {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  isPrivate: boolean;
  squareMeters: number;
  rooms: number;
  floor?: number;
  hasElevator?: boolean;
  hasGarage?: boolean;
  constructionYear?: number;
  addressZone?: string;
}

export interface WizardStep3Data {
  images: string[];
}

export interface WizardStep4Data {
  contactMethods: MercatinoContactMethod[];
}

export interface WizardStep5Data {
  donationAmount?: number;
}

export interface MercatinoWizardData {
  step1: WizardStep1Data;
  step2: WizardStep2ObjectData | WizardStep2RealEstateData;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  step5: WizardStep5Data;
}

// ============================================================================
// GET Actions
// ============================================================================

/**
 * Get all approved mercatino items (public + private for verified residents only)
 */
export async function getApprovedMercatinoItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is a verified resident
  let isVerifiedResident = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    isVerifiedResident = profile?.verification_status === 'approved';
  }

  let query = supabase
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
    .order('created_at', { ascending: false });

  // Only verified residents can see private items
  if (!isVerifiedResident) {
    query = query.eq('is_private', false);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('[Mercatino] Error fetching items:', error);
    return { items: [] };
  }

  // Transform data to ensure proper types
  // NOTE: New columns (listing_type, contact_methods, etc.) will be available
  // after running the mercatino migrations. Using 'as any' for forward compatibility.
  const items = (data || []).map((item: any) => ({
    ...item,
    images: Array.isArray(item.images) ? item.images : null,
    // Extract category info from relation
    category_id: item.category?.id || item.category_id || null,
    category_name: item.category?.name || null,
    // New Mercatino fields - use defaults until migrations are run
    contact_methods: Array.isArray((item as any).contact_methods) ? (item as any).contact_methods : [],
    listing_type: (item as any).listing_type || 'objects',
    has_donated: (item as any).has_donated || false,
    donation_amount: (item as any).donation_amount || 0,
    view_count: (item as any).view_count || 0,
  }));

  return { items };
}

/**
 * Get mercatino item by ID (with access control for private items)
 */
export async function getMercatinoItemById(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('marketplace_items')
    .select(`
      *,
      category:categories(id, name, slug),
      seller:users!seller_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('id', itemId)
    .single();

  if (error || !data) {
    return { item: null };
  }

  // Check access control for private items
  if (data.is_private) {
    if (!user) {
      return { item: null };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (profile?.verification_status !== 'approved') {
      return { item: null };
    }
  }

  // Transform data
  // NOTE: New columns will be available after running mercatino migrations
  const item = {
    ...data,
    images: Array.isArray(data.images) ? data.images : null,
    // New Mercatino fields - use defaults until migrations are run
    contact_methods: Array.isArray((data as any).contact_methods) ? (data as any).contact_methods : [],
    listing_type: (data as any).listing_type || 'objects',
    has_donated: (data as any).has_donated || false,
    donation_amount: (data as any).donation_amount || 0,
    view_count: (data as any).view_count || 0,
  };

  return { item };
}

/**
 * Get user's own mercatino items
 */
export async function getMyMercatinoItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { items: [] };
  }

  const { data, error } = await supabase
    .from('marketplace_items')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Mercatino] Error fetching user items:', error);
    return { items: [] };
  }

  // Transform data to ensure proper types
  // NOTE: New columns will be available after running mercatino migrations
  const items = (data || []).map((item: any) => ({
    ...item,
    images: Array.isArray(item.images) ? item.images : null,
    condition: item.condition as string | null,
    status: item.status as MercatinoStatus,
    // New Mercatino fields - use defaults until migrations are run
    contact_methods: Array.isArray((item as any).contact_methods) ? (item as any).contact_methods : [],
    listing_type: (item as any).listing_type || 'objects',
    has_donated: (item as any).has_donated || false,
    donation_amount: (item as any).donation_amount || 0,
    view_count: (item as any).view_count || 0,
  }));

  return { items };
}

// ============================================================================
// CREATE Actions (Wizard)
// ============================================================================

/**
 * Create new mercatino item using wizard data
 * All 5 steps combined into single database insert
 */
export async function createMercatinoItem(wizardData: MercatinoWizardData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Get user profile for tenant_id and verification
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono creare annunci' };
  }

  // Validate step 1
  const step1Parsed = mercatinoWizardStep1Schema.safeParse(wizardData.step1);
  if (!step1Parsed.success) {
    return { error: 'Dati step 1 non validi: ' + step1Parsed.error.message };
  }

  // Validate step 2 based on listing type
  const isRealEstate = step1Parsed.data.listingType === 'real_estate';
  const step2Schema = isRealEstate
    ? mercatinoWizardStep2RealEstateSchema
    : mercatinoWizardStep2ObjectSchema;

  const step2Parsed = step2Schema.safeParse(wizardData.step2);
  if (!step2Parsed.success) {
    return { error: 'Dati step 2 non validi: ' + step2Parsed.error.message };
  }

  // Validate step 3 (images)
  if (!wizardData.step3.images || wizardData.step3.images.length === 0) {
    return { error: 'Carica almeno 1 immagine' };
  }
  if (wizardData.step3.images.length > 6) {
    return { error: 'Massimo 6 immagini' };
  }

  // Validate step 4 (contacts)
  const step4Parsed = mercatinoWizardStep4Schema.safeParse(wizardData.step4);
  if (!step4Parsed.success) {
    return { error: 'Dati contatto non validi: ' + step4Parsed.error.message };
  }

  // Validate step 5 (donation - optional)
  const step5Parsed = mercatinoWizardStep5Schema.safeParse(wizardData.step5);

  // Build insert data
  const step2Data = step2Parsed.data as any;

  const insertData: any = {
    // Basic fields
    title: step2Data.title,
    description: step2Data.description,
    price: step2Data.price,
    // Save subcategoryId if present (leaf category), otherwise categoryId (for "Altro")
    category_id: step2Data.subcategoryId || step2Data.categoryId,
    is_private: step2Data.isPrivate,
    images: wizardData.step3.images,
    seller_id: user.id,
    tenant_id: profile.tenant_id,
    status: 'pending',
    is_sold: false,

    // Listing type
    listing_type: step1Parsed.data.listingType,
    real_estate_type: step1Parsed.data.realEstateType || null,
    object_type: step1Parsed.data.objectType || null,

    // Contact methods
    contact_methods: step4Parsed.data.contactMethods,
  };

  // Add type-specific fields
  if (isRealEstate) {
    const realEstateData = step2Data as WizardStep2RealEstateData;
    insertData.square_meters = realEstateData.squareMeters;
    insertData.rooms = realEstateData.rooms;
    insertData.floor = realEstateData.floor ?? null;
    insertData.has_elevator = realEstateData.hasElevator ?? null;
    insertData.has_garage = realEstateData.hasGarage ?? null;
    insertData.construction_year = realEstateData.constructionYear ?? null;
    insertData.address_zone = realEstateData.addressZone ?? null;
    insertData.condition = null; // Real estate doesn't have condition
  } else {
    const objectData = step2Data as WizardStep2ObjectData;
    insertData.condition = objectData.condition;
  }

  // Insert item
  const { data: insertedItem, error: itemError } = await supabase
    .from('marketplace_items')
    .insert(insertData)
    .select('id')
    .single();

  if (itemError || !insertedItem) {
    console.error('[Mercatino] Failed to create item:', itemError);
    return { error: 'Errore durante la creazione dell\'annuncio' };
  }

  const itemId = insertedItem.id;

  // Create moderation queue entry
  const { error: moderationError } = await supabase
    .from('moderation_queue')
    .insert({
      item_type: 'marketplace',
      item_id: itemId,
      tenant_id: profile.tenant_id,
      item_creator_id: user.id,
      status: 'pending',
    });

  if (moderationError) {
    console.error('[Mercatino] Failed to create moderation entry:', moderationError);
    // Rollback item creation
    await supabase.from('marketplace_items').delete().eq('id', itemId);
    return { error: 'Errore durante l\'invio in moderazione' };
  }

  // Handle donation if present
  const donationAmountCents = step5Parsed.success && step5Parsed.data.wantsToDonate
    ? step5Parsed.data.donationAmountCents
    : 0;
  if (donationAmountCents && donationAmountCents >= 100) {
    // Return itemId and flag for donation - client will redirect to Stripe
    return {
      success: true,
      itemId,
      requiresDonation: true,
      donationAmountCents,
    };
  }

  revalidatePath(ROUTES.MERCATINO);
  revalidatePath(ROUTES.BACHECA);
  return { success: true, itemId };
}

// ============================================================================
// UPDATE Actions
// ============================================================================

/**
 * Update mercatino item (owner only)
 */
export async function updateMercatinoItem(
  itemId: string,
  wizardData: Partial<MercatinoWizardData>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id, status, tenant_id')
    .eq('id', itemId)
    .single();

  if (!item || item.seller_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  // Build update data from wizard steps
  const updateData: any = {
    status: 'pending', // Reset status - requires re-moderation
  };

  if (wizardData.step2) {
    const step2Data = wizardData.step2 as any;
    updateData.title = step2Data.title;
    updateData.description = step2Data.description;
    updateData.price = step2Data.price;
    // Save subcategoryId if present (leaf category), otherwise categoryId (for "Altro")
    updateData.category_id = step2Data.subcategoryId || step2Data.categoryId;
    updateData.is_private = step2Data.isPrivate;

    // Handle type-specific fields
    if ('condition' in step2Data) {
      updateData.condition = step2Data.condition;
    }
    if ('squareMeters' in step2Data) {
      updateData.square_meters = step2Data.squareMeters;
      updateData.rooms = step2Data.rooms;
      updateData.floor = step2Data.floor ?? null;
      updateData.has_elevator = step2Data.hasElevator ?? null;
      updateData.has_garage = step2Data.hasGarage ?? null;
      updateData.construction_year = step2Data.constructionYear ?? null;
      updateData.address_zone = step2Data.addressZone ?? null;
    }
  }

  if (wizardData.step3?.images) {
    updateData.images = wizardData.step3.images;
  }

  if (wizardData.step4?.contactMethods) {
    updateData.contact_methods = wizardData.step4.contactMethods;
  }

  // Update item
  const { error } = await supabase
    .from('marketplace_items')
    .update(updateData)
    .eq('id', itemId);

  if (error) {
    console.error('[Mercatino] Failed to update item:', error);
    return { error: 'Errore durante l\'aggiornamento dell\'annuncio' };
  }

  // Create new moderation queue entry
  const { error: moderationError } = await supabase
    .from('moderation_queue')
    .insert({
      item_type: 'marketplace',
      item_id: itemId,
      tenant_id: item.tenant_id,
      item_creator_id: user.id,
      status: 'pending',
    });

  if (moderationError) {
    console.error('[Mercatino] Failed to create moderation entry:', moderationError);
  }

  revalidatePath(ROUTES.MERCATINO);
  revalidatePath(`${ROUTES.MERCATINO}/${itemId}`);
  revalidatePath(ROUTES.BACHECA);

  return {
    success: true,
    message: 'Modifiche salvate. L\'annuncio sarà visibile dopo l\'approvazione.',
  };
}

/**
 * Mark item as sold (owner only)
 */
export async function markMercatinoItemAsSold(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id')
    .eq('id', itemId)
    .single();

  if (!item || item.seller_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('marketplace_items')
    .update({ is_sold: true })
    .eq('id', itemId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dello stato' };
  }

  revalidatePath(ROUTES.MERCATINO);
  revalidatePath(`${ROUTES.MERCATINO}/${itemId}`);
  return { success: true };
}

// ============================================================================
// DELETE Actions
// ============================================================================

/**
 * Delete mercatino item (owner only)
 */
export async function deleteMercatinoItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id')
    .eq('id', itemId)
    .single();

  if (!item || item.seller_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('marketplace_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione dell\'annuncio' };
  }

  revalidatePath(ROUTES.MERCATINO);
  return { success: true };
}

// ============================================================================
// VIEW TRACKING
// ============================================================================

/**
 * Track a unique view for a mercatino item
 * Uses browser fingerprint for anonymous users
 *
 * @param itemId - The item being viewed
 * @param fingerprint - Browser fingerprint hash (FingerprintJS)
 * @param ipPartial - Partial IP for analytics (first 3 octets)
 * @param userAgent - Browser user agent
 * @returns Whether this was a new unique view
 */
export async function trackMercatinoView(
  itemId: string,
  fingerprint: string,
  ipPartial?: string,
  userAgent?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate fingerprint
  if (!fingerprint || fingerprint.length < 8) {
    return { success: false, error: 'Invalid fingerprint' };
  }

  // Call the RPC function that handles upsert
  // NOTE: This RPC function will be available after running mercatino migrations
  // Using 'as any' to bypass type checking until migrations are run
  const { data, error } = await (supabase.rpc as any)('register_mercatino_view', {
    p_item_id: itemId,
    p_fingerprint: fingerprint.substring(0, 64), // Truncate to max length
    p_user_id: user?.id ?? null,
    p_ip_partial: ipPartial?.substring(0, 20) ?? null,
    p_user_agent: userAgent?.substring(0, 500) ?? null,
  });

  if (error) {
    console.error('[Mercatino] Error tracking view:', error);
    return { success: false, error: error.message };
  }

  // data is boolean: true if new view, false if duplicate
  return { success: true, isNewView: data === true };
}

/**
 * Get view statistics for an item (owner or admin only)
 */
export async function getMercatinoViewStats(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is owner or admin
  // NOTE: view_count column will be available after running mercatino migrations
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { error: 'Annuncio non trovato' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, admin_role')
    .eq('id', user.id)
    .single();

  const isOwner = item.seller_id === user.id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.admin_role;

  if (!isOwner && !isAdmin) {
    return { error: 'Non autorizzato' };
  }

  // Get detailed view stats
  // NOTE: mercatino_views table will be available after running mercatino migrations
  // Using 'as any' to bypass type checking until migrations are run
  const { data: views, error } = await (supabase.from as any)('mercatino_views')
    .select('viewed_at, user_id')
    .eq('item_id', itemId)
    .order('viewed_at', { ascending: false }) as { data: Array<{ viewed_at: string; user_id: string | null }> | null; error: any };

  if (error) {
    return { error: 'Errore nel recupero statistiche' };
  }

  // Get view_count from item (will be available after migrations)
  const { data: itemWithCount } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('id', itemId)
    .single();

  const viewCount = (itemWithCount as any)?.view_count || views?.length || 0;

  return {
    totalViews: viewCount,
    uniqueViews: views?.length || 0,
    registeredUserViews: views?.filter(v => v.user_id).length || 0,
    anonymousViews: views?.filter(v => !v.user_id).length || 0,
    recentViews: views?.slice(0, 10) || [],
  };
}

// ============================================================================
// DONATION
// ============================================================================

/**
 * Create Stripe checkout session for donation
 * Returns checkout URL for redirect
 *
 * NOTE: Stripe integration will be implemented in FASE 5
 * This is a placeholder that marks the donation intent
 */
export async function createMercatinoDonation(
  itemId: string,
  amountCents: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Validate amount (minimum 100 cents = 1 EUR)
  if (amountCents < 100) {
    return { error: 'Importo minimo: 1€' };
  }

  // Check ownership
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id')
    .eq('id', itemId)
    .single();

  if (!item || item.seller_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  // TODO: FASE 5 - Integrate with Stripe Checkout
  // For now, just mark the intent and return success
  // The actual Stripe integration will create a checkout session

  return {
    success: true,
    message: 'Donation intent recorded. Stripe integration coming soon.',
    itemId,
    amountCents,
  };
}

/**
 * Mark donation as completed (called from Stripe webhook)
 * NOTE: New columns (has_donated, donation_amount, donated_at) will be available
 * after running mercatino migrations.
 */
export async function completeMercatinoDonation(
  itemId: string,
  amountCents: number,
  stripeSessionId: string
) {
  const supabase = await createClient();

  // Using 'as any' because new columns won't exist until migrations run
  const { error } = await supabase
    .from('marketplace_items')
    .update({
      has_donated: true,
      donation_amount: amountCents,
      donated_at: new Date().toISOString(),
    } as any)
    .eq('id', itemId);

  if (error) {
    console.error('[Mercatino] Failed to complete donation:', error);
    return { error: 'Errore durante il completamento della donazione' };
  }

  revalidatePath(`${ROUTES.MERCATINO}/${itemId}`);
  return { success: true };
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// Re-export with old names for backward compatibility
export {
  getApprovedMercatinoItems as getApprovedItems,
  getMercatinoItemById as getItemById,
  getMyMercatinoItems as getMyItems,
  deleteMercatinoItem as deleteMarketplaceItem,
  markMercatinoItemAsSold as markItemAsSold,
};
