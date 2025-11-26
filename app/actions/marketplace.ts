'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createMarketplaceItemSchema } from '@/lib/utils/validators';

/**
 * Get all approved marketplace items (public + private for verified residents only)
 */
export async function getApprovedItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is a verified resident
  let isVerifiedResident = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

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
  // If user is verified resident, show all items (public + private)

  const { data, error } = await query.limit(50);

  if (error) {
    return { items: [] };
  }

  return { items: data };
}

/**
 * Get marketplace item by ID (with access control for private items)
 */
export async function getItemById(itemId: string) {
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
    .single() as {
      data: {
        id: string;
        title: string;
        description: string;
        price: number;
        category: {
          id: string;
          name: string;
          slug: string;
        } | null;
        condition: string;
        images: string[];
        committee_percentage: number;
        is_private: boolean;
        seller_id: string;
        tenant_id: string;
        status: string;
        is_sold: boolean;
        created_at: string;
        updated_at: string;
        seller: {
          id: string;
          name: string;
          avatar: string;
          bio: string;
        };
      } | null;
      error: any;
    };

  if (error) {
    return { item: null };
  }

  // Check access control for private items
  if (data?.is_private) {
    if (!user) {
      return { item: null }; // Not authenticated - no access
    }

    // Check if user is verified resident
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    if (profile?.verification_status !== 'approved') {
      return { item: null }; // Not verified - no access
    }
  }

  return { item: data };
}

/**
 * Create new marketplace item (verified users, goes to moderation)
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
  // Database will generate UUID automatically via DEFAULT uuid_generate_v4()
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
    })
    .select('id')
    .single()) as { data: { id: string } | null; error: any };

  if (itemError || !insertedItem) {
    console.error('[Marketplace] Failed to create item:', itemError);
    return { error: 'Errore durante la creazione dell\'annuncio' };
  }

  // Extract the database-generated UUID
  const itemId = insertedItem.id;

  // Create moderation queue entry
  // Database will generate UUID automatically
  console.log('[MARKETPLACE] Creating moderation queue entry with:', {
    item_type: 'marketplace',
    item_id: itemId,
    tenant_id: profile.tenant_id,
    item_creator_id: user.id,
    status: 'pending',
  });

  const { data: moderationData, error: moderationError } = await supabase
    .from('moderation_queue')
    .insert({
      item_type: 'marketplace',
      item_id: itemId,
      tenant_id: profile.tenant_id,
      item_creator_id: user.id,
      status: 'pending',
    })
    .select('*')
    .single();

  if (moderationError) {
    console.error('[MARKETPLACE] Failed to create moderation queue entry!');
    console.error('[MARKETPLACE] Error details:', {
      message: moderationError.message,
      code: moderationError.code,
      details: moderationError.details,
      hint: moderationError.hint,
    });
    // Rollback item creation
    await supabase.from('marketplace_items').delete().eq('id', itemId);
    return { error: 'Errore durante l\'invio in moderazione' };
  }

  console.log('[MARKETPLACE] Moderation queue entry created successfully!');
  console.log('[MARKETPLACE] Created entry:', moderationData);

  revalidatePath('/marketplace');
  return { success: true, itemId };
}

/**
 * Update marketplace item (owner only)
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

  // Update item and reset status to pending (re-moderation required)
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
      status: 'pending',  // Reset status - requires re-moderation
    })
    .eq('id', itemId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dell\'annuncio' };
  }

  // Create new moderation queue entry for re-moderation
  console.log('[MARKETPLACE UPDATE] Sending to moderation:', {
    itemId,
    userId: user.id,
    tenantId: item.tenant_id,
  });

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
    console.error('[MARKETPLACE UPDATE] Failed to create moderation queue entry:', moderationError);
    // Don't rollback the update - item is already saved
    // But inform user of the issue
    return {
      error: 'Annuncio aggiornato ma errore durante l\'invio in moderazione. Contatta il supporto.'
    };
  }

  console.log('[MARKETPLACE UPDATE] Moderation queue entry created successfully');

  revalidatePath('/marketplace');
  revalidatePath(`/marketplace/${itemId}`);
  revalidatePath('/bacheca');
  return {
    success: true,
    message: 'Modifiche salvate. L\'annuncio sarà nuovamente visibile dopo l\'approvazione.'
  };
}

/**
 * Delete marketplace item (owner only)
 */
export async function deleteMarketplaceItem(itemId: string) {
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
    .single() as { data: { seller_id: string } | null };

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

  revalidatePath('/marketplace');
  return { success: true };
}

/**
 * Mark item as sold (owner only)
 */
export async function markItemAsSold(itemId: string) {
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
    .single() as { data: { seller_id: string } | null };

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

  revalidatePath('/marketplace');
  revalidatePath(`/marketplace/${itemId}`);
  return { success: true };
}

/**
 * Get user's own marketplace items
 */
export async function getMyItems() {
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
    return { items: [] };
  }

  return { items: data };
}
