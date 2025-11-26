'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/utils/validators';

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, bio, avatar, phone, role, admin_role, committee_role, membership_type, verification_status, tenant_id, created_at, updated_at')
    .eq('id', user.id)
    .single() as {
      data: {
        id: string;
        name: string;
        email: string;
        bio: string;
        avatar: string;
        phone: string | null;
        role: string;
        admin_role: string | null;
        committee_role: string | null;
        membership_type: string | null;
        verification_status: string;
        tenant_id: string;
        created_at: string;
        updated_at: string;
      } | null;
      error: any;
    };

  return { user: profile };
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const rawData = {
    name: formData.get('name') as string,
    bio: formData.get('bio') as string,
    phone: formData.get('phone') as string,
    avatar: formData.get('avatar') as string,
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('users')
    .update(parsed.data)
    .eq('id', user.id);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del profilo' };
  }

  revalidatePath('/profile');
  revalidatePath('/bacheca');
  return { success: true };
}

/**
 * Get user activities (placeholder - requires SQL function)
 */
export async function getUserActivities(userId: string) {
  const supabase = await createClient();

  // TODO: Implement SQL function for activities
  // For now, return empty array
  return { activities: [] };
}

/**
 * Get user badges
 * @param userId - User ID or 'current' for authenticated user
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient();

  // Handle 'current' user
  let targetUserId = userId;
  if (userId === 'current') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { badges: [] };
    }
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges!badge_id (
        id,
        name,
        description,
        icon,
        points
      )
    `)
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false });

  if (error) {
    return { badges: [] };
  }

  return { badges: data };
}

/**
 * Get user points total
 * @param userId - User ID or 'current' for authenticated user
 */
export async function getUserPoints(userId: string) {
  const supabase = await createClient();

  // Handle 'current' user
  let targetUserId = userId;
  if (userId === 'current') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { totalPoints: 0, level: 1 };
    }
    targetUserId = user.id;
  }

  // Get all user badges and sum points
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      badge:badges!badge_id (points)
    `)
    .eq('user_id', targetUserId);

  if (!userBadges) {
    return { totalPoints: 0, level: 1 };
  }

  const totalPoints = userBadges.reduce((sum, ub: any) => {
    return sum + (ub.badge?.points || 0);
  }, 0);

  // Calculate level (100 points per level)
  const level = Math.floor(totalPoints / 100) + 1;

  return { totalPoints, level };
}

/**
 * Admin: Get all users with pagination and filtering
 */
export async function getAllUsers(page: number = 1, limit: number = 50, filters?: {
  role?: string;
  verification_status?: string;
  search?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { users: [], total: 0, error: 'Non autenticato' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { users: [], total: 0, error: 'Accesso negato' };
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar,
        phone,
        role,
        admin_role,
        committee_role,
        is_in_board,
        is_in_council,
        verification_status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role as never);
    }
    if (filters?.verification_status && filters.verification_status !== 'all') {
      query = query.eq('verification_status', filters.verification_status as never);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return { users: [], total: 0, error: 'Errore durante il caricamento' };
    }

    return { users: data, total: count || 0 };
  } catch (error) {
    return { users: [], total: 0, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Update user role
 */
export async function updateUserRole(userId: string, role: string, adminRole?: string | null) {
  try {
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
      return { error: 'Accesso negato' };
    }

    const updateData: any = { role };
    if (adminRole !== undefined) {
      updateData.admin_role = adminRole;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Update user verification status
 */
export async function updateVerificationStatus(userId: string, status: 'pending' | 'approved' | 'rejected') {
  try {
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
      return { error: 'Accesso negato' };
    }

    const { error } = await supabase
      .from('users')
      .update({ verification_status: status })
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Delete user (soft delete by setting inactive)
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check if user is super_admin (only super admin can delete)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || profile.role !== 'super_admin') {
      return { error: 'Solo i super admin possono eliminare utenti' };
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return { error: 'Non puoi eliminare il tuo account' };
    }

    // For now, we'll mark as inactive instead of hard delete
    // Hard delete would require CASCADE setup in database
    const { error } = await supabase
      .from('users')
      .update({ role: 'inactive' as never })
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'eliminazione' };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}
