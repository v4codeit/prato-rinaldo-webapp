'use server';

/**
 * DEPRECATED: Use app/actions/mercatino.ts instead
 * This file is kept for backward compatibility only.
 *
 * Server actions must export only async functions.
 * Types should be imported directly from mercatino.ts
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createMarketplaceItemSchema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import {
  getApprovedMercatinoItems,
  getMercatinoItemById,
  getMyMercatinoItems,
  deleteMercatinoItem,
  markMercatinoItemAsSold,
  trackMercatinoView as trackMercatinoViewAction,
  createMercatinoDonation as createMercatinoDonationAction,
  completeMercatinoDonation as completeMercatinoDonationAction,
  getMercatinoViewStats as getMercatinoViewStatsAction,
  createMercatinoItem as createMercatinoItemAction,
  updateMercatinoItem as updateMercatinoItemAction,
} from './mercatino';

// Backward compatible wrapper functions (Server Actions must be async)

/**
 * @deprecated Use getApprovedMercatinoItems from mercatino.ts instead
 */
export async function getApprovedItems() {
  return getApprovedMercatinoItems();
}

/**
 * @deprecated Use getMercatinoItemById from mercatino.ts instead
 */
export async function getItemById(itemId: string) {
  return getMercatinoItemById(itemId);
}

/**
 * @deprecated Use getMyMercatinoItems from mercatino.ts instead
 */
export async function getMyItems() {
  return getMyMercatinoItems();
}

/**
 * @deprecated Use deleteMercatinoItem from mercatino.ts instead
 */
export async function deleteMarketplaceItem(itemId: string) {
  return deleteMercatinoItem(itemId);
}

/**
 * @deprecated Use markMercatinoItemAsSold from mercatino.ts instead
 */
export async function markItemAsSold(itemId: string) {
  return markMercatinoItemAsSold(itemId);
}

/**
 * @deprecated Use trackMercatinoView from mercatino.ts instead
 */
export async function trackMercatinoView(
  itemId: string,
  fingerprint: string,
  ipPartial?: string,
  userAgent?: string
) {
  return trackMercatinoViewAction(itemId, fingerprint, ipPartial, userAgent);
}

/**
 * @deprecated Use createMercatinoDonation from mercatino.ts instead
 */
export async function createMercatinoDonation(
  itemId: string,
  amountCents: number
) {
  return createMercatinoDonationAction(itemId, amountCents);
}

/**
 * @deprecated Use completeMercatinoDonation from mercatino.ts instead
 */
export async function completeMercatinoDonation(
  itemId: string,
  amountCents: number,
  stripeSessionId: string
) {
  return completeMercatinoDonationAction(itemId, amountCents, stripeSessionId);
}

/**
 * @deprecated Use getMercatinoViewStats from mercatino.ts instead
 */
export async function getMercatinoViewStats(itemId: string) {
  return getMercatinoViewStatsAction(itemId);
}

/**
 * @deprecated Use createMercatinoItem from mercatino.ts instead
 * This is the legacy marketplace item creation function.
 * Kept for backward compatibility with existing forms.
 */
export async function createMarketplaceItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono creare annunci' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
    categoryId: formData.get('categoryId') as string,
    condition: formData.get('condition') as string,
    isPrivate: formData.get('isPrivate') === 'true',
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],
    committeePercentage: formData.get('committeePercentage')
      ? parseInt(formData.get('committeePercentage') as string)
      : 0,
  };

  const parsed = createMarketplaceItemSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Create marketplace item with pending status
  // Uses default 'objects' listing type for backward compatibility
  const { data: insertedItem, error: itemError } = (await supabase
    .from('marketplace_items')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      category_id: parsed.data.categoryId,
      condition: parsed.data.condition,
      is_private: parsed.data.isPrivate,
      images: parsed.data.images,
      committee_percentage: parsed.data.committeePercentage,
      seller_id: user.id,
      tenant_id: profile.tenant_id,
      status: 'pending',
      is_sold: false,
      // New Mercatino defaults
      listing_type: 'objects',
      object_type: 'sale',
      contact_methods: [],
    })
    .select('id')
    .single()) as { data: { id: string } | null; error: any };

  if (itemError || !insertedItem) {
    console.error('[Marketplace] Failed to create item:', itemError);
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
    console.error('[Marketplace] Failed to create moderation queue entry:', moderationError);
    await supabase.from('marketplace_items').delete().eq('id', itemId);
    return { error: 'Errore durante l\'invio in moderazione' };
  }

  revalidatePath(ROUTES.MERCATINO);
  return { success: true, itemId };
}

/**
 * @deprecated Use updateMercatinoItem from mercatino.ts instead
 * Legacy update function for backward compatibility.
 */
export async function updateMarketplaceItem(itemId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership and get current status
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id, status, tenant_id')
    .eq('id', itemId)
    .single() as { data: { seller_id: string; status: string; tenant_id: string } | null };

  if (!item || item.seller_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
    categoryId: formData.get('categoryId') as string,
    condition: formData.get('condition') as string,
    isPrivate: formData.get('isPrivate') === 'true',
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],
    committeePercentage: formData.get('committeePercentage')
      ? parseInt(formData.get('committeePercentage') as string)
      : 0,
  };

  const parsed = createMarketplaceItemSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Update item and reset status to pending
  const { error } = await supabase
    .from('marketplace_items')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      category_id: parsed.data.categoryId,
      condition: parsed.data.condition,
      is_private: parsed.data.isPrivate,
      images: parsed.data.images,
      committee_percentage: parsed.data.committeePercentage,
      status: 'pending',
    })
    .eq('id', itemId);

  if (error) {
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
    console.error('[Marketplace] Failed to create moderation queue entry:', moderationError);
  }

  revalidatePath(ROUTES.MERCATINO);
  revalidatePath(`${ROUTES.MERCATINO}/${itemId}`);
  revalidatePath(ROUTES.BACHECA);

  return {
    success: true,
    message: 'Modifiche salvate. L\'annuncio sarà nuovamente visibile dopo l\'approvazione.'
  };
}
