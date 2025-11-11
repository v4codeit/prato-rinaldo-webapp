'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
    .select('role, admin_role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; admin_role: string | null; tenant_id: string } | null };

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
    const { user, profile } = await requireModerator();

    console.log('[MODERATION] getModerationQueue called with:', {
      page,
      limit,
      filters,
      userId: user.id,
      userRole: profile.role,
      adminRole: profile.admin_role,
      tenantId: profile.tenant_id,
    });

    const supabase = await createClient();

    const offset = (page - 1) * limit;

    let query = supabase
      .from('moderation_queue')
      .select(`
        *,
        submitter:users!item_creator_id (
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
      console.log('[MODERATION] Applying status filter:', filters.status);
    }
    if (filters?.itemType) {
      query = query.eq('item_type', filters.itemType);
      console.log('[MODERATION] Applying itemType filter:', filters.itemType);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    console.log('[MODERATION] Query results:', {
      itemsFound: data?.length || 0,
      totalCount: count,
      hasError: !!error,
      errorDetails: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      } : null,
    });

    if (data && data.length > 0) {
      const firstItem = data[0] as any;
      console.log('[MODERATION] First item sample:', {
        id: firstItem.id,
        item_type: firstItem.item_type,
        status: firstItem.status,
        tenant_id: firstItem.tenant_id,
        item_creator_id: firstItem.item_creator_id,
        created_at: firstItem.created_at,
      });
    }

    if (error) {
      console.error('[MODERATION] Query error:', error);
      return { items: [], total: 0 };
    }

    return { items: data, total: count || 0 };
  } catch (error) {
    console.error('[MODERATION] Exception in getModerationQueue:', error);
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
        submitter:users!item_creator_id (
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
          item_creator_id: string;
          assigned_to: string | null;
          status: string;
          moderated_at: string | null;
          moderated_by: string | null;
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
    if (item.item_type === 'marketplace') {
      const { data } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', item.item_id)
        .single() as { data: any | null };
      content = data;
    } else if (item.item_type === 'service_profile') {
      const { data } = await supabase
        .from('service_profiles')
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
        moderator:users!performed_by (
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

    // Get queue item details for logging
    const { data: queueItem } = await supabase
      .from('moderation_queue')
      .select('tenant_id, item_type, item_id')
      .eq('id', itemId)
      .single() as { data: { tenant_id: string; item_type: string; item_id: string } | null };

    const { error } = await supabase
      .from('moderation_queue')
      .update({ assigned_to: userId })
      .eq('id', itemId);

    if (error) {
      return { error: 'Errore durante l\'assegnazione' };
    }

    // Log action with correct field names
    if (queueItem) {
      const { error: logError } = await supabase.from('moderation_actions_log').insert({
        queue_item_id: itemId,
        tenant_id: queueItem.tenant_id,
        item_type: queueItem.item_type,
        item_id: queueItem.item_id,
        performed_by: user.id,
        action: userId ? 'assigned' : 'unassigned',
        note: userId ? `Assegnato a ${userId}` : 'Rimosso assegnazione',
      });

      if (logError) {
        console.error('[MODERATION] Failed to log assign action:', logError);
      }
    }

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
      .select('item_type, item_id, tenant_id')
      .eq('id', itemId)
      .single() as { data: { item_type: string; item_id: string; tenant_id: string } | null };

    if (!item) {
      return { error: 'Elemento non trovato' };
    }

    // Update moderation queue
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'approved',
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
      })
      .eq('id', itemId);

    if (queueError) {
      return { error: 'Errore durante l\'approvazione' };
    }

    // Update related item status
    if (item.item_type === 'marketplace') {
      await supabase
        .from('marketplace_items')
        .update({ status: 'approved' })
        .eq('id', item.item_id);
    } else if (item.item_type === 'service_profile') {
      await supabase
        .from('service_profiles')
        .update({ status: 'approved' })
        .eq('id', item.item_id);

      // Send approval email notification (non-blocking)
      const { data: profile } = await supabase
        .from('service_profiles')
        .select(`
          id,
          business_name,
          category,
          profile_type,
          user:users!user_id(email, name)
        `)
        .eq('id', item.item_id)
        .single() as { data: any | null };

      if (profile && profile.user?.email) {
        // Import email function dynamically to avoid circular dependencies
        import('./email-notifications').then(({ sendProfessionalApprovalEmail }) => {
          sendProfessionalApprovalEmail({
            recipientEmail: profile.user.email,
            recipientName: profile.user.name || 'Utente',
            businessName: profile.business_name,
            profileType: profile.profile_type,
            category: profile.category,
            profileId: profile.id,
          }).catch(error => {
            console.error('[MODERATION] Failed to send approval email:', error);
          });
        });
      }
    }

    // Log action with correct field names
    const { error: logError } = await supabase.from('moderation_actions_log').insert({
      queue_item_id: itemId,
      tenant_id: item.tenant_id,
      item_type: item.item_type,
      item_id: item.item_id,
      performed_by: user.id,
      action: 'approved',
      note: notes || 'Approvato',
    });

    if (logError) {
      console.error('[MODERATION] Failed to log approval action:', logError);
    }

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
      .select('item_type, item_id, tenant_id')
      .eq('id', itemId)
      .single() as { data: { item_type: string; item_id: string; tenant_id: string } | null };

    if (!item) {
      return { error: 'Elemento non trovato' };
    }

    // Update moderation queue with rejection reason
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'rejected',
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
        moderation_note: reason,
      })
      .eq('id', itemId);

    if (queueError) {
      return { error: 'Errore durante il rifiuto' };
    }

    // Update related item status
    if (item.item_type === 'marketplace') {
      await supabase
        .from('marketplace_items')
        .update({ status: 'rejected' })
        .eq('id', item.item_id);
    } else if (item.item_type === 'service_profile') {
      await supabase
        .from('service_profiles')
        .update({ status: 'rejected' })
        .eq('id', item.item_id);

      // Send rejection email notification (non-blocking)
      const { data: profile } = await supabase
        .from('service_profiles')
        .select(`
          id,
          business_name,
          profile_type,
          user:users!user_id(email, name)
        `)
        .eq('id', item.item_id)
        .single() as { data: any | null };

      if (profile && profile.user?.email) {
        // Import email function dynamically to avoid circular dependencies
        import('./email-notifications').then(({ sendProfessionalRejectionEmail }) => {
          sendProfessionalRejectionEmail({
            recipientEmail: profile.user.email,
            recipientName: profile.user.name || 'Utente',
            businessName: profile.business_name,
            profileType: profile.profile_type,
            rejectionReason: reason,
            profileId: profile.id,
          }).catch(error => {
            console.error('[MODERATION] Failed to send rejection email:', error);
          });
        });
      }
    }

    // Log action with correct field names
    const { error: logError } = await supabase.from('moderation_actions_log').insert({
      queue_item_id: itemId,
      tenant_id: item.tenant_id,
      item_type: item.item_type,
      item_id: item.item_id,
      performed_by: user.id,
      action: 'rejected',
      note: reason,
    });

    if (logError) {
      console.error('[MODERATION] Failed to log rejection action:', logError);
    }

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
  itemType: 'marketplace' | 'service_profile' | 'proposal' | 'proposal_comment',
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
      item_type: itemType,
      item_id: itemId,
      tenant_id: profile.tenant_id,
      item_creator_id: user.id,
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
        submitter:users!item_creator_id (
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
