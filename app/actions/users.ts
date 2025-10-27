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
    .select('id, name, email, bio, avatar, phone, role, admin_role, committee_role, verification_status, tenant_id, created_at, updated_at')
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
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient();

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
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    return { badges: [] };
  }

  return { badges: data };
}

/**
 * Get user points total
 */
export async function getUserPoints(userId: string) {
  const supabase = await createClient();

  // Get all user badges and sum points
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      badge:badges!badge_id (points)
    `)
    .eq('user_id', userId);

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
