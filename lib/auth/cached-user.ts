'use server';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Cached User Fetching for Layouts
 *
 * This module provides React cache() wrapped functions for user fetching in layout components.
 *
 * WHY: Next.js 16 + Turbopack requires dynamic data (cookies, headers) to be either:
 * 1. Wrapped in <Suspense> boundary, OR
 * 2. Cached with React cache() to enable static prerendering
 *
 * Since layouts cannot be wrapped in Suspense (they're root components),
 * we use cache() to prevent "Uncached data accessed outside of Suspense" errors.
 *
 * BENEFITS:
 * - Deduplicates user fetching across layout hierarchy
 * - Enables Next.js to cache the result during static prerendering
 * - Prevents blocking async operations in layouts
 * - Type-safe with full User type
 */

/**
 * Get current authenticated user (cached)
 *
 * Returns null if not authenticated - layouts should handle null gracefully.
 * This function is cached, so multiple calls in the same request return the same result.
 *
 * @returns User object or null
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // AuthSessionMissingError è ATTESO per utenti non autenticati su pagine pubbliche
      // Non loggare come errore - è comportamento normale di Supabase
      // Ref: https://github.com/orgs/supabase/discussions/26791
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Error fetching user in getCachedUser:', error);
      }
      return null;
    }

    return user;
  } catch (error) {
    // Eccezioni inaspettate - loggare sempre
    console.error('Exception in getCachedUser:', error);
    return null;
  }
});

/**
 * Get user profile with extended data (cached)
 *
 * Fetches user + profile data in a single cached call.
 * Returns null if not authenticated or profile not found.
 *
 * @param fields - Profile fields to select (default: common layout fields)
 * @returns Extended user object with profile data or null
 */
export const getCachedUserProfile = cache(async (
  fields: string = 'role, admin_role, verification_status, onboarding_completed, avatar'
): Promise<any | null> => {
  try {
    const user = await getCachedUser();
    if (!user) return null;

    // Type narrowing: user is guaranteed non-null here
    const authenticatedUser = user as User;

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('users')
      .select(fields)
      .eq('id', authenticatedUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile in getCachedUserProfile:', error);
      return null;
    }

    if (!profile) {
      return null;
    }

    // Merge user + profile (both guaranteed non-null here)
    return { ...authenticatedUser, ...(profile as Record<string, any>) };
  } catch (error) {
    console.error('Exception in getCachedUserProfile:', error);
    return null;
  }
});

/**
 * Get user with minimal profile data for public layouts (cached)
 *
 * Optimized for public pages that only need basic user info.
 *
 * @returns User with minimal profile (verification_status, role, avatar) or null
 */
export const getCachedUserMinimal = cache(async (): Promise<any | null> => {
  return getCachedUserProfile('verification_status, role, avatar');
});

/**
 * Get user with auth-required profile data (cached)
 *
 * For authenticated routes that need onboarding status.
 *
 * @returns User with auth profile (onboarding_completed, verification_status, role, avatar) or null
 */
export const getCachedUserAuth = cache(async (): Promise<any | null> => {
  return getCachedUserProfile('onboarding_completed, verification_status, role, avatar');
});

/**
 * Get user with admin profile data (cached)
 *
 * For admin routes that need admin role info.
 *
 * @returns User with admin profile (role, admin_role, verification_status, avatar) or null
 */
export const getCachedUserAdmin = cache(async (): Promise<any | null> => {
  return getCachedUserProfile('role, admin_role, verification_status, avatar');
});
