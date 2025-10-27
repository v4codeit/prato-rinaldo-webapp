'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

/**
 * Check if current user is admin or moderator
 */
async function requireModerator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non autenticato');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, admin_role')
    .eq('id', user.id)
    .single() as { data: { role: string; admin_role: string | null } | null };

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const isModerator = profile?.admin_role === 'moderator';

  if (!isAdmin && !isModerator) {
    throw new Error('Accesso negato');
  }

  return { user, profile };
}

/**
 * Get moderation queue with pagination
 */
export async function getModerationQueue(page: number = 1, limit: number = 20, filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  itemType?: string;
}) {
  try {
    await requireModerator();
    const supabase = await createClient();

    const offset = (page - 1) * limit;

    let query = supabase
      .from('moderation_queue')
      .select(`
        *,
        submitter:users!submitted_by (
          id,
          name,
          avatar
        ),
        assignee:users!assigned_to (
          id,
          name,
          avatar
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.itemType) {
      query = query.eq('item_type', filters.itemType);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return { items: [], total: 0 };
    }

    return { items: data, total: count || 0 };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Get moderation queue item by ID with related content
 */
export async function getModerationItemById(itemId: string) {
  try {
    await requireModerator();
    const supabase = await createClient();

    const { data: item, error } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        submitter:users!submitted_by (
          id,
          name,
          avatar,
          email
        ),
        assignee:users!assigned_to (
          id,
          name,
          avatar
        )
      `)
      .eq('id', itemId)
      .single() as {
        data: {
          id: string;
          item_type: string;
          item_id: string;
          tenant_id: string;
          submitted_by: string;
          assigned_to: string | null;
          status: string;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
          submitter: {
            id: string;
            name: string;
            avatar: string;
            email: string;
          };
          assignee: {
            id: string;
            name: string;
            avatar: string;
          } | null;
        } | null;
        error: any;
      };

    if (error || !item) {
      return { item: null, content: null };
    }

    // Fetch related content based on item_type
    let content = null;
    if (item.item_type === 'marketplace_item') {
      const { data } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', item.item_id)
        .single() as { data: any | null };
      content = data;
    } else if (item.item_type === 'professional_profile') {
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('id', item.item_id)
        .single() as { data: any | null };
      content = data;
    } else if (item.item_type === 'proposal') {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', item.item_id)
        .single() as { data: any | null };
      content = data;
    } else if (item.item_type === 'tutorial_request') {
      const { data } = await supabase
        .from('tutorial_requests')
        .select('*')
        .eq('id', item.item_id)
        .single() as { data: any | null };
      content = data;
    }

    // Get action logs
    const { data: logs } = await supabase
      .from('moderation_actions_log')
      .select(`
        *,
        moderator:users!moderator_id (
          id,
          name,
          avatar
        )
      `)
      .eq('moderation_id', itemId)
      .order('created_at', { ascending: false });

    return { item, content, logs: logs || [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Assign moderation item to user
 */
export async function assignModerationItem(itemId: string, userId: string | null) {
  try {
    const { user } = await requireModerator();
    const supabase = await createClient();

    const { error } = await supabase
      .from('moderation_queue')
      .update({ assigned_to: userId })
      .eq('id', itemId);

    if (error) {
      return { error: 'Errore durante l\'assegnazione' };
    }

    // Log action
    await supabase.from('moderation_actions_log').insert({
      id: nanoid(),
      moderation_id: itemId,
      moderator_id: user.id,
      action: userId ? 'assigned' : 'unassigned',
      notes: userId ? `Assegnato a ${userId}` : 'Rimosso assegnazione',
    });

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Approve moderation item
 */
export async function approveModerationItem(itemId: string, notes?: string) {
  try {
    const { user } = await requireModerator();
    const supabase = await createClient();

    // Get moderation item
    const { data: item } = await supabase
      .from('moderation_queue')
      .select('item_type, item_id')
      .eq('id', itemId)
      .single() as { data: { item_type: string; item_id: string } | null };

    if (!item) {
      return { error: 'Elemento non trovato' };
    }

    // Update moderation queue
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', itemId);

    if (queueError) {
      return { error: 'Errore durante l\'approvazione' };
    }

    // Update related item status
    if (item.item_type === 'marketplace_item') {
      await supabase
        .from('marketplace_items')
        .update({ status: 'approved' })
        .eq('id', item.item_id);
    } else if (item.item_type === 'professional_profile') {
      await supabase
        .from('professional_profiles')
        .update({ status: 'approved' })
        .eq('id', item.item_id);
    }

    // Log action
    await supabase.from('moderation_actions_log').insert({
      id: nanoid(),
      moderation_id: itemId,
      moderator_id: user.id,
      action: 'approved',
      notes: notes || 'Approvato',
    });

    revalidatePath('/admin/moderation');
    revalidatePath('/marketplace');
    revalidatePath('/professionals');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Reject moderation item
 */
export async function rejectModerationItem(itemId: string, reason: string) {
  try {
    const { user } = await requireModerator();
    const supabase = await createClient();

    // Get moderation item
    const { data: item } = await supabase
      .from('moderation_queue')
      .select('item_type, item_id')
      .eq('id', itemId)
      .single() as { data: { item_type: string; item_id: string } | null };

    if (!item) {
      return { error: 'Elemento non trovato' };
    }

    // Update moderation queue
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'rejected',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', itemId);

    if (queueError) {
      return { error: 'Errore durante il rifiuto' };
    }

    // Update related item status
    if (item.item_type === 'marketplace_item') {
      await supabase
        .from('marketplace_items')
        .update({ status: 'rejected' })
        .eq('id', item.item_id);
    } else if (item.item_type === 'professional_profile') {
      await supabase
        .from('professional_profiles')
        .update({ status: 'rejected' })
        .eq('id', item.item_id);
    }

    // Log action
    await supabase.from('moderation_actions_log').insert({
      id: nanoid(),
      moderation_id: itemId,
      moderator_id: user.id,
      action: 'rejected',
      notes: reason,
    });

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Report content for moderation
 */
export async function reportContent(
  itemType: 'marketplace_item' | 'professional_profile' | 'proposal' | 'proposal_comment',
  itemId: string,
  reason: string
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single() as { data: { tenant_id: string } | null };

    if (!profile) {
      return { error: 'Profilo non trovato' };
    }

    // Check if already reported
    const { data: existing } = await supabase
      .from('moderation_queue')
      .select('id')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('status', 'pending')
      .single() as { data: { id: string } | null };

    if (existing) {
      return { error: 'Questo contenuto è già stato segnalato' };
    }

    const { error } = await supabase.from('moderation_queue').insert({
      id: nanoid(),
      item_type: itemType,
      item_id: itemId,
      tenant_id: profile.tenant_id,
      submitted_by: user.id,
      status: 'pending',
    });

    if (error) {
      return { error: 'Errore durante la segnalazione' };
    }

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Get my assigned moderation items
 */
export async function getMyModerationItems() {
  try {
    const { user } = await requireModerator();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        submitter:users!submitted_by (
          id,
          name,
          avatar
        )
      `)
      .eq('assigned_to', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return { items: [] };
    }

    return { items: data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}
