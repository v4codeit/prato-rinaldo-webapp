'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createMarketplaceItemSchema } from '@/lib/utils/validators';
import { nanoid } from 'nanoid';

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
        category: string;
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

  const itemId = nanoid();

  // Create marketplace item with pending status
  const { error: itemError } = await supabase.from('marketplace_items').insert({
    id: itemId,
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
  });

  if (itemError) {
    return { error: 'Errore durante la creazione dell\'annuncio' };
  }

  // Create moderation queue entry
  const { error: moderationError } = await supabase.from('moderation_queue').insert({
    id: nanoid(),
    item_type: 'marketplace_item',
    item_id: itemId,
    tenant_id: profile.tenant_id,
    submitted_by: user.id,
    status: 'pending',
  });

  if (moderationError) {
    // Rollback item creation
    await supabase.from('marketplace_items').delete().eq('id', itemId);
    return { error: 'Errore durante l\'invio in moderazione' };
  }

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

  // Check ownership
  const { data: item } = await supabase
    .from('marketplace_items')
    .select('seller_id')
    .eq('id', itemId)
    .single() as { data: { seller_id: string } | null };

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
    })
    .eq('id', itemId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dell\'annuncio' };
  }

  revalidatePath('/marketplace');
  revalidatePath(`/marketplace/${itemId}`);
  return { success: true };
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
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { items: [] };
  }

  return { items: data };
}
