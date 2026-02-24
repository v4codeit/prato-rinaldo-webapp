'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireVerifiedResident, isAdmin } from '@/lib/auth/dal';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createTagSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Lo slug deve contenere solo lettere minuscole, numeri e trattini').optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Il colore deve essere un codice esadecimale valido').optional(),
  icon: z.string().max(50).optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(50).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Lo slug deve contenere solo lettere minuscole, numeri e trattini').optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Il colore deve essere un codice esadecimale valido').optional(),
  icon: z.string().max(50).optional(),
  is_active: z.boolean().optional(),
});

// =====================================================
// TYPES
// =====================================================

export type ProposalTag = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTagInput = {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
};

export type UpdateTagInput = {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

// =====================================================
// TAG QUERIES
// =====================================================

/**
 * Get all active proposal tags
 * Returns tags ordered by order_index
 */
export async function getProposalTags() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_tags')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[getProposalTags] Error:', error);
    return { tags: [] as ProposalTag[] };
  }

  return { tags: (data || []) as ProposalTag[] };
}

/**
 * Get tag by ID
 */
export async function getTagById(tagId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_tags')
    .select('*')
    .eq('id', tagId)
    .single();

  if (error) {
    console.error('[getTagById] Error:', error);
    return { tag: null };
  }

  return { tag: data as ProposalTag };
}

/**
 * Get all tags assigned to a proposal
 * Returns tags with join through proposal_tag_assignments
 */
export async function getProposalTagAssignments(proposalId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_tag_assignments')
    .select(`
      tag:proposal_tags (*)
    `)
    .eq('proposal_id', proposalId);

  if (error) {
    console.error('[getProposalTagAssignments] Error:', error);
    return { tags: [] as ProposalTag[] };
  }

  // Extract tags from the join result
  const tags = (data || [])
    .map((item: any) => item.tag)
    .filter((tag: any) => tag !== null) as ProposalTag[];

  return { tags };
}

// =====================================================
// TAG ASSIGNMENTS
// =====================================================

/**
 * Assign tags to a proposal (replace existing)
 * User must be proposal author or admin
 */
export async function assignTagsToProposal(proposalId: string, tagIds: string[]) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Non autenticato' };
  }

  // Get proposal to check ownership
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('author_id, tenant_id')
    .eq('id', proposalId)
    .single() as { data: { author_id: string; tenant_id: string } | null; error: any };

  if (proposalError || !proposal) {
    return { success: false, error: 'Proposta non trovata' };
  }

  // Check authorization (owner or admin)
  const isOwner = proposal.author_id === user.id;
  const isUserAdmin = await isAdmin(user.id);

  if (!isOwner && !isUserAdmin) {
    return { success: false, error: 'Non autorizzato a modificare i tag di questa proposta' };
  }

  // Validate that all tags exist and are active
  const { data: validTags, error: validationError } = await supabase
    .from('proposal_tags')
    .select('id')
    .in('id', tagIds)
    .eq('is_active', true)
    .eq('tenant_id', proposal.tenant_id);

  if (validationError || !validTags || validTags.length !== tagIds.length) {
    return { success: false, error: 'Uno o più tag non sono validi' };
  }

  // Remove existing assignments
  const { error: deleteError } = await supabase
    .from('proposal_tag_assignments')
    .delete()
    .eq('proposal_id', proposalId);

  if (deleteError) {
    console.error('[assignTagsToProposal] Delete error:', deleteError);
    return { success: false, error: 'Errore durante la rimozione dei tag esistenti' };
  }

  // Insert new assignments (if any)
  if (tagIds.length > 0) {
    const assignments = tagIds.map((tagId) => ({
      proposal_id: proposalId,
      tag_id: tagId,
      tenant_id: proposal.tenant_id,
    }));

    const { error: insertError } = await supabase
      .from('proposal_tag_assignments')
      .insert(assignments);

    if (insertError) {
      console.error('[assignTagsToProposal] Insert error:', insertError);
      return { success: false, error: 'Errore durante l\'assegnazione dei tag' };
    }
  }

  revalidatePath('/agora');
  revalidatePath(`/agora/${proposalId}`);
  return { success: true };
}

// =====================================================
// TAG MANAGEMENT (ADMIN ONLY)
// =====================================================

/**
 * Create new tag (admin only)
 */
export async function createTag(data: CreateTagInput) {
  const supabase = await createClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { tag: null, error: 'Non autenticato' };
  }

  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    return { tag: null, error: 'Solo gli amministratori possono creare tag' };
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!profile) {
    return { tag: null, error: 'Profilo non trovato' };
  }

  // Validate input
  const parsed = createTagSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { tag: null, error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Generate slug if not provided
  const slug = parsed.data.slug || generateSlug(parsed.data.name);

  // Check if slug already exists
  const { data: existingTag } = await supabase
    .from('proposal_tags')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('slug', slug)
    .single();

  if (existingTag) {
    return { tag: null, error: 'Esiste già un tag con questo slug' };
  }

  // Get max order_index
  const { data: maxOrder } = await supabase
    .from('proposal_tags')
    .select('order_index')
    .eq('tenant_id', profile.tenant_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null };

  // Create tag
  const { data: newTag, error } = await supabase
    .from('proposal_tags')
    .insert({
      tenant_id: profile.tenant_id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      color: parsed.data.color || '#0891b2',
      icon: parsed.data.icon || null,
      order_index: (maxOrder?.order_index || 0) + 1,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[createTag] Error:', error);
    return { tag: null, error: 'Errore durante la creazione del tag' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/tags');
  return { tag: newTag as ProposalTag, error: null };
}

/**
 * Update tag (admin only)
 */
export async function updateTag(tagId: string, data: UpdateTagInput) {
  const supabase = await createClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { tag: null, error: 'Non autenticato' };
  }

  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    return { tag: null, error: 'Solo gli amministratori possono modificare tag' };
  }

  // Validate input
  const parsed = updateTagSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { tag: null, error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!profile) {
    return { tag: null, error: 'Profilo non trovato' };
  }

  // Check if slug is being changed and if it conflicts
  if (parsed.data.slug) {
    const { data: existingTag } = await supabase
      .from('proposal_tags')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('slug', parsed.data.slug)
      .neq('id', tagId)
      .single();

    if (existingTag) {
      return { tag: null, error: 'Esiste già un tag con questo slug' };
    }
  }

  // Build update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;
  if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;

  // Update tag
  const { data: updatedTag, error } = await supabase
    .from('proposal_tags')
    .update(updateData)
    .eq('id', tagId)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single();

  if (error) {
    console.error('[updateTag] Error:', error);
    return { tag: null, error: 'Errore durante l\'aggiornamento del tag' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/tags');
  return { tag: updatedTag as ProposalTag, error: null };
}

/**
 * Delete tag (admin only - soft delete)
 * Sets is_active to false instead of deleting
 */
export async function deleteTag(tagId: string) {
  const supabase = await createClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Non autenticato' };
  }

  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    return { success: false, error: 'Solo gli amministratori possono eliminare tag' };
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!profile) {
    return { success: false, error: 'Profilo non trovato' };
  }

  // Soft delete (set is_active to false)
  const { error } = await supabase
    .from('proposal_tags')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tagId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    console.error('[deleteTag] Error:', error);
    return { success: false, error: 'Errore durante l\'eliminazione del tag' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/tags');
  return { success: true };
}

// =====================================================
// ADMIN QUERIES
// =====================================================

/**
 * Get all tags including inactive (admin only)
 * Used in admin panel for tag management
 */
export async function getAllTags() {
  const supabase = await createClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { tags: [], error: 'Non autenticato' };
  }

  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    return { tags: [], error: 'Solo gli amministratori possono visualizzare tutti i tag' };
  }

  const { data, error } = await supabase
    .from('proposal_tags')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[getAllTags] Error:', error);
    return { tags: [], error: 'Errore durante il caricamento dei tag' };
  }

  return { tags: (data || []) as ProposalTag[], error: null };
}

/**
 * Reorder tags (admin only)
 * Updates order_index for multiple tags
 */
export async function reorderTags(tagOrders: Array<{ id: string; order_index: number }>) {
  const supabase = await createClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Non autenticato' };
  }

  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    return { success: false, error: 'Solo gli amministratori possono riordinare i tag' };
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!profile) {
    return { success: false, error: 'Profilo non trovato' };
  }

  // Update each tag's order_index
  const updatePromises = tagOrders.map(({ id, order_index }) =>
    supabase
      .from('proposal_tags')
      .update({ order_index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
  );

  try {
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('[reorderTags] Error:', error);
    return { success: false, error: 'Errore durante il riordino dei tag' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/tags');
  return { success: true };
}
