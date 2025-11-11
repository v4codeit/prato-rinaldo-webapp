'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Check if current user is admin
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non autenticato');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Accesso negato');
  }

  return { user, profile };
}

/**
 * Get dashboard statistics
 *
 * This function uses pre-calculated stats from the aggregated_stats table for performance.
 * Stats are automatically refreshed every 6 hours via the Stats Aggregation Edge Function.
 * If cached stats are missing or older than 6 hours, it falls back to live queries.
 *
 * For manual refresh, use refreshDashboardStats()
 */
export async function getDashboardStats() {
  try {
    const { user, profile } = await requireAdmin();
    const supabase = await createClient();

    // Get user's tenant_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single() as { data: { tenant_id: string } | null };

    if (!userProfile) {
      return { error: 'Profilo non trovato' };
    }

    // Try to get cached stats from aggregated_stats table
    const { data: cachedStats, error: cacheError } = await supabase
      .from('aggregated_stats')
      .select('stat_key, stat_value, updated_at')
      .eq('tenant_id', userProfile.tenant_id) as { data: Array<{ stat_key: string; stat_value: number; updated_at: string }> | null; error: any };

    // If cache is fresh (< 6 hours old), use it
    if (cachedStats && cachedStats.length > 0 && !cacheError) {
      const latestUpdate = new Date(cachedStats[0].updated_at);
      const hoursSinceUpdate = (Date.now() - latestUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 6) {
        // Convert array to stats object
        const statsMap = cachedStats.reduce((acc, { stat_key, stat_value }) => {
          acc[stat_key] = stat_value;
          return acc;
        }, {} as Record<string, number>);

        return {
          stats: {
            users: statsMap.total_users || 0,
            articles: statsMap.articles_total || 0,
            events: statsMap.events_total || 0,
            marketplace: statsMap.marketplace_items_total || 0,
            professionals: statsMap.professional_profiles_total || 0,
            proposals: statsMap.proposals_total || 0,
            pendingModeration: statsMap.moderation_pending || 0,
          },
          cached: true,
          lastUpdate: latestUpdate.toISOString(),
        };
      }
    }

    // Fallback: Run live queries if cache is missing or older than 6 hours
    const [
      { count: usersCount },
      { count: articlesCount },
      { count: eventsCount },
      { count: marketplaceCount },
      { count: professionalsCount },
      { count: proposalsCount },
      { count: pendingModerationCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
      supabase.from('professional_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      stats: {
        users: usersCount || 0,
        articles: articlesCount || 0,
        events: eventsCount || 0,
        marketplace: marketplaceCount || 0,
        professionals: professionalsCount || 0,
        proposals: proposalsCount || 0,
        pendingModeration: pendingModerationCount || 0,
      },
      cached: false,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Manually refresh dashboard statistics
 *
 * This function triggers the Stats Aggregation Edge Function to recalculate
 * all statistics immediately, instead of waiting for the automatic 6-hour refresh.
 *
 * Requires admin privileges.
 */
export async function refreshDashboardStats() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Invoke the Stats Aggregation Edge Function
    const { data, error } = await supabase.functions.invoke('aggregate-stats');

    if (error) {
      return { error: 'Errore durante l\'aggiornamento delle statistiche' };
    }

    revalidatePath('/admin');
    return { success: true, stats: data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(page: number = 1, limit: number = 50, filters?: {
  role?: string;
  verificationStatus?: string;
  search?: string;
}) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return { users: [], total: 0 };
    }

    return { users: data, total: count || 0 };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Update user role (super_admin only)
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    const { profile } = await requireAdmin();
    const supabase = await createClient();

    if (profile.role !== 'super_admin') {
      return { error: 'Solo i super admin possono modificare i ruoli' };
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento del ruolo' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Update user verification status
 */
export async function updateUserVerificationStatus(
  userId: string,
  status: 'pending' | 'approved' | 'rejected'
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('users')
      .update({ verification_status: status })
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento dello stato di verifica' };
    }

    // Award "Benvenuto" badge if approved
    if (status === 'approved') {
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('slug', 'benvenuto')
        .single() as { data: { id: string } | null };

      if (badge) {
        const { data: existing } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_id', badge.id)
          .single() as { data: { id: string } | null };

        if (!existing) {
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
          });
        }
      }
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Update user admin role
 */
export async function updateUserAdminRole(userId: string, adminRole: string | null) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('users')
      .update({ admin_role: adminRole })
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento del ruolo admin' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Update user committee role
 */
export async function updateUserCommitteeRole(
  userId: string,
  committeeRole: string | null,
  isInBoard?: boolean,
  isInCouncil?: boolean
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const updateData: {
      committee_role: string | null;
      is_in_board?: boolean;
      is_in_council?: boolean;
    } = {
      committee_role: committeeRole,
    };

    // Only update is_in_board and is_in_council if provided
    if (isInBoard !== undefined) {
      updateData.is_in_board = isInBoard;
    }
    if (isInCouncil !== undefined) {
      updateData.is_in_council = isInCouncil;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento del ruolo nel comitato' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Delete user (super_admin only)
 */
export async function deleteUser(userId: string) {
  try {
    const { profile } = await requireAdmin();

    if (profile.role !== 'super_admin') {
      return { error: 'Solo i super admin possono eliminare utenti' };
    }

    const adminClient = createAdminClient();

    // Delete from auth.users (cascades to users table via trigger)
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      return { error: 'Errore durante l\'eliminazione dell\'utente' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Get tenant settings
 */
export async function getTenantSettings() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user!.id)
      .single() as { data: { tenant_id: string } | null };

    if (!profile) {
      return { error: 'Profilo non trovato' };
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    if (error) {
      return { error: 'Errore durante il caricamento delle impostazioni' };
    }

    return { settings: data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(formData: FormData) {
  try {
    const { profile } = await requireAdmin();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user!.id)
      .single() as { data: { tenant_id: string } | null };

    if (!userProfile) {
      return { error: 'Profilo non trovato' };
    }

    const updates = {
      name: formData.get('name') as string,
      logo_url: formData.get('logoUrl') as string || null,
      primary_color: formData.get('primaryColor') as string || null,
      secondary_color: formData.get('secondaryColor') as string || null,
      contact_email: formData.get('contactEmail') as string || null,
      contact_phone: formData.get('contactPhone') as string || null,
      address: formData.get('address') as string || null,
      facebook_url: formData.get('facebookUrl') as string || null,
      instagram_url: formData.get('instagramUrl') as string || null,
      website_url: formData.get('websiteUrl') as string || null,
    };

    const { error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', userProfile.tenant_id);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento delle impostazioni' };
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}
