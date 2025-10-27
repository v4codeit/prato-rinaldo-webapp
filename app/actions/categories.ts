'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type CategoryType = 'event' | 'marketplace_item';

export interface Category {
  id: string;
  name: string;
  slug: string;
  item_type: CategoryType;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get active categories for a specific item type
 */
export async function getCategories(itemType: CategoryType) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('item_type', itemType)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return { categories: [] };
  }

  return { categories: (data || []) as unknown as Category[] };
}

/**
 * Get all active categories (both events and marketplace)
 */
export async function getAllCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('item_type, display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all categories:', error);
    return { categories: [] };
  }

  return { categories: (data || []) as unknown as Category[] };
}

/**
 * Get category by ID
 */
export async function getCategoryById(categoryId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single() as { data: Category | null; error: any };

  if (error) {
    console.error('Error fetching category:', error);
    return { category: null };
  }

  return { category: data };
}

/**
 * Create new category (Admin only)
 */
export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Solo gli admin possono creare categorie' };
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const itemType = formData.get('itemType') as CategoryType;
  const description = (formData.get('description') as string) || null;
  const icon = (formData.get('icon') as string) || null;
  const displayOrder = formData.get('displayOrder')
    ? parseInt(formData.get('displayOrder') as string)
    : 0;

  if (!name || !slug || !itemType) {
    return { error: 'Nome, slug e tipo sono obbligatori' };
  }

  const { data, error } = await supabase.from('categories').insert({
    name,
    slug,
    item_type: itemType,
    description,
    icon,
    display_order: displayOrder,
    tenant_id: profile.tenant_id,
  }).select().single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: 'Una categoria con questo slug esiste già per questo tipo' };
    }
    return { error: 'Errore durante la creazione della categoria' };
  }

  revalidatePath('/admin/categories');
  return { success: true, category: data };
}

/**
 * Update category (Admin only)
 */
export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Solo gli admin possono modificare categorie' };
  }

  const name = formData.get('name') as string;
  const description = (formData.get('description') as string) || null;
  const icon = (formData.get('icon') as string) || null;
  const displayOrder = formData.get('displayOrder')
    ? parseInt(formData.get('displayOrder') as string)
    : undefined;
  const isActive = formData.get('isActive') === 'true';

  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;
  if (displayOrder !== undefined) updateData.display_order = displayOrder;
  if (isActive !== undefined) updateData.is_active = isActive;

  const { error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', categoryId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento della categoria' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

/**
 * Delete category (Admin only) - Soft delete by marking as inactive
 */
export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Solo gli admin possono eliminare categorie' };
  }

  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', categoryId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione della categoria' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}
