'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get all available badges
 */
export async function getAllBadges() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('points', { ascending: false });

  if (error || !data) {
    return { badges: [] as Array<{
      id: string;
      name: string;
      description: string;
      slug: string;
      icon: string;
      points: number;
      category: string;
      created_at: string;
      updated_at: string;
    }> };
  }

  return { badges: (data as any) as Array<{
    id: string;
    name: string;
    description: string;
    slug: string;
    icon: string;
    points: number;
    category: string;
    created_at: string;
    updated_at: string;
  }> };
}

/**
 * Get user badges with details
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      earned_at,
      badge:badges (
        id,
        name,
        description,
        icon,
        points,
        category,
        slug
      )
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error || !data) {
    return { badges: [] as Array<{
      id: string;
      earned_at: string;
      badge: {
        id: string;
        name: string;
        description: string;
        icon: string;
        points: number;
        category: string;
        slug: string;
      } | null;
    }> };
  }

  return { badges: (data as any) as Array<{
    id: string;
    earned_at: string;
    badge: {
      id: string;
      name: string;
      description: string;
      icon: string;
      points: number;
      category: string;
      slug: string;
    } | null;
  }> };
}

/**
 * Award badge to user
 */
export async function awardBadge(userId: string, badgeSlug: string) {
  const supabase = await createClient();

  // Get badge by slug
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', badgeSlug)
    .single() as { data: { id: string } | null };

  if (!badge) {
    return { error: 'Badge non trovato' };
  }

  // Check if user already has this badge
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .single() as { data: { id: string } | null };

  if (existing) {
    return { error: 'Badge già assegnato' };
  }

  // Award badge
  const { error } = await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badge.id,
  });

  if (error) {
    return { error: 'Errore durante l\'assegnazione del badge' };
  }

  return { success: true };
}

/**
 * Calculate user level based on total points
 */
export async function getUserLevel(userId: string) {
  const { badges } = await getUserBadges(userId);

  const totalPoints = badges.reduce((sum, ub) => {
    return sum + (ub.badge?.points || 0);
  }, 0);

  // Level calculation: 100 points per level
  const level = Math.floor(totalPoints / 100) + 1;

  // Points needed for next level
  const pointsForNextLevel = level * 100;
  const pointsToNextLevel = pointsForNextLevel - totalPoints;

  return {
    level,
    totalPoints,
    pointsToNextLevel,
    pointsForNextLevel,
  };
}

/**
 * Get leaderboard (top users by points)
 */
export async function getLeaderboard(limit: number = 10) {
  const supabase = await createClient();

  // Get all users with their badges
  const { data: users } = await supabase
    .from('users')
    .select(`
      id,
      name,
      avatar,
      user_badges (
        badge:badges (
          points
        )
      )
    `)
    .eq('verification_status', 'approved')
    .limit(100);

  if (!users) {
    return { leaderboard: [] };
  }

  // Calculate total points for each user
  const leaderboard = (users as any[])
    .map((user) => {
      const totalPoints = user.user_badges?.reduce((sum: number, ub: any) => {
        return sum + (ub.badge?.points || 0);
      }, 0) || 0;

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        totalPoints,
        level: Math.floor(totalPoints / 100) + 1,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit);

  return { leaderboard };
}

/**
 * Trigger badge calculation for all users via Edge Function
 *
 * This function manually invokes the Badge Calculation Edge Function which processes
 * all users and awards badges based on their activity. Badge calculation now happens
 * automatically via database triggers, but this function can be used for manual
 * recalculation or administrative purposes.
 *
 * @returns Object containing success status, message, and calculation statistics
 *
 * @example
 * const result = await triggerBadgeCalculation();
 * if (result.success) {
 *   console.log(result.message, result.stats);
 * }
 */
export async function triggerBadgeCalculation() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke('calculate-badges', {
      body: {} // Empty body, function processes all users
    });

    if (error) {
      console.error('Badge calculation error:', error);
      return { error: 'Failed to trigger badge calculation' };
    }

    return {
      success: true,
      message: data?.message || 'Badge calculation triggered',
      stats: data?.data
    };
  } catch (error) {
    console.error('Unexpected error during badge calculation:', error);
    return { error: 'Unexpected error triggering badge calculation' };
  }
}

/**
 * @deprecated This function is deprecated. Badge calculation is now handled automatically
 * by the Badge Calculation Edge Function (supabase/functions/calculate-badges/) which is
 * triggered via database hooks on user actions. Use triggerBadgeCalculation() if you need
 * to manually trigger badge recalculation for administrative purposes.
 *
 * Check and award achievement-based badges (LEGACY)
 */
export async function checkAndAwardBadges(userId: string, action: string) {
  const supabase = await createClient();

  // Define badge award logic based on action
  switch (action) {
    case 'complete_onboarding':
      await awardBadge(userId, 'benvenuto');
      break;

    case 'first_proposal':
      await awardBadge(userId, 'primo-post');
      break;

    case 'first_event_rsvp':
      // Check if user has attended 5+ events
      const { count: eventsCount } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'going');

      if (eventsCount && eventsCount >= 5) {
        await awardBadge(userId, 'partecipante-attivo');
      }
      break;

    case 'marketplace_item_sold':
      await awardBadge(userId, 'venditore');
      break;

    case 'volunteer':
      await awardBadge(userId, 'volontario');
      break;

    case 'donation':
      await awardBadge(userId, 'contributore');
      break;

    default:
      break;
  }

  return { success: true };
}

/**
 * Get user's progress towards next badges
 */
export async function getUserProgress(userId: string) {
  const supabase = await createClient();

  // Get user's current badges
  const { badges: userBadges } = await getUserBadges(userId);
  const earnedBadgeSlugs = userBadges.map((ub) => ub.badge?.slug).filter(Boolean);

  // Get all badges
  const { badges: allBadges } = await getAllBadges();

  // Calculate progress for unearn badges
  const progress = [];

  for (const badge of allBadges) {
    if (earnedBadgeSlugs.includes(badge.slug)) {
      continue;
    }

    let current = 0;
    let total = 1;

    // Calculate progress based on badge type
    if (badge.slug === 'primo-post') {
      const { count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);
      current = count || 0;
      total = 1;
    } else if (badge.slug === 'partecipante-attivo') {
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'going');
      current = count || 0;
      total = 5;
    } else if (badge.slug === 'venditore') {
      const { count } = await supabase
        .from('marketplace_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('is_sold', true);
      current = count || 0;
      total = 1;
    }

    if (current > 0) {
      progress.push({
        badge,
        current,
        total,
        percentage: Math.min(100, Math.floor((current / total) * 100)),
      });
    }
  }

  return { progress };
}

/**
 * Get badge by slug
 */
export async function getBadgeBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('slug', slug)
    .single() as {
      data: {
        id: string;
        name: string;
        description: string;
        slug: string;
        icon: string;
        points: number;
        category: string;
        created_at: string;
        updated_at: string;
      } | null;
      error: any;
    };

  if (error || !data) {
    return { badge: null };
  }

  // Get count of users with this badge
  const { count } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('badge_id', data.id);

  return { badge: { ...data, users_count: count || 0 } };
}

/**
 * Get recent badge awards (activity feed)
 */
export async function getRecentBadgeAwards(limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      earned_at,
      user:users (
        id,
        name,
        avatar
      ),
      badge:badges (
        id,
        name,
        icon,
        points
      )
    `)
    .order('earned_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { awards: [] };
  }

  return { awards: data };
}
