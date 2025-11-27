/**
 * Data Access Layer (DAL) for Authentication
 *
 * Centralizes all auth-related logic following Next.js 16 best practices.
 * Auth checks are performed in page components, not layouts.
 *
 * Pattern:
 * - Layouts: minimal, no auth checks
 * - Pages: call DAL functions for auth/authorization
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 */

'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES, VERIFICATION_STATUS, ADMIN_ROLES } from '@/lib/utils/constants';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  role: string;
  admin_role: string | null;
  committee_role: string | null;
  verification_status: string;
  membership_type: string | null;
  onboarding_completed: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface VerifiedResident extends UserProfile {
  verification_status: 'approved';
}

export interface AdminUser extends UserProfile {
  role: 'admin' | 'super_admin';
  admin_role: 'moderator' | null;
}

// ============================================================================
// Core Session Functions
// ============================================================================

/**
 * Get current session user (can be null for anonymous users)
 * Use in public pages where auth is optional
 */
export async function getSession(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Require authenticated user (redirect to login if not)
 * Use in authenticated pages
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(ROUTES.LOGIN);
  }

  return user;
}

// ============================================================================
// User Profile Functions
// ============================================================================

/**
 * Get user profile from database (can be null if user not found)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single() as { data: UserProfile | null; error: any };

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Require user profile (redirect to home if not found)
 */
export async function requireUserProfile(userId: string): Promise<UserProfile> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    redirect(ROUTES.HOME);
  }

  return profile;
}

// ============================================================================
// Onboarding Functions
// ============================================================================

/**
 * Check if user has completed onboarding (redirect if not)
 * Use after requireAuth() in pages that need onboarding
 */
export async function requireOnboarding(userId: string): Promise<void> {
  const profile = await getUserProfile(userId);

  if (!profile || !profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }
}

/**
 * Get user with onboarding check
 * Combines requireAuth() + requireOnboarding()
 */
export async function requireAuthWithOnboarding(): Promise<{ user: User; profile: UserProfile }> {
  const user = await requireAuth();
  const profile = await requireUserProfile(user.id);

  if (!profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }

  return { user, profile };
}

// ============================================================================
// Verification Functions
// ============================================================================

/**
 * Require verified resident status (redirect if not approved)
 * Use in private pages (/agora, /resources, /community, etc.)
 * NOTE: For /bacheca, use requireAuthWithPendingAccess() instead
 *
 * - Pending users → redirect to /bacheca (shows "waiting for approval" message)
 * - Rejected users → redirect to /bacheca (shows "rejected" message)
 * This prevents redirect loops on mobile where / auto-redirects to /bacheca
 */
export async function requireVerifiedResident(): Promise<VerifiedResident> {
  const user = await requireAuth();
  const profile = await requireUserProfile(user.id);

  // Check onboarding
  if (!profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }

  // Check verification status - redirect to bacheca to avoid mobile redirect loop
  // Bacheca handles both pending and rejected users with dedicated messages
  if (profile.verification_status !== VERIFICATION_STATUS.APPROVED) {
    redirect(ROUTES.BACHECA);
  }

  return profile as VerifiedResident;
}

/**
 * Require authenticated user with completed onboarding (allows pending/rejected)
 * Use ONLY in /bacheca where non-verified users should see status-specific messages
 * instead of being redirected (which causes a loop on mobile)
 *
 * Returns the profile with verification_status that can be 'pending', 'approved', or 'rejected'
 * The page component is responsible for showing appropriate UI based on status
 */
export async function requireAuthWithPendingAccess(): Promise<UserProfile> {
  const user = await requireAuth();
  const profile = await requireUserProfile(user.id);

  // Check onboarding - users must have completed onboarding
  if (!profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }

  // Allow all verification statuses - page will show appropriate message
  return profile;
}

/**
 * Check if user is a verified resident (no redirect)
 * Returns true/false
 */
export async function isVerifiedResident(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.verification_status === VERIFICATION_STATUS.APPROVED;
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Require admin role (redirect if not authorized)
 * Use in admin pages (/admin/*)
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireAuth();
  const profile = await requireUserProfile(user.id);

  const isAdmin =
    profile.role === 'admin' ||
    profile.role === 'super_admin' ||
    profile.admin_role === 'moderator';

  if (!isAdmin) {
    redirect(ROUTES.HOME);
  }

  return profile as AdminUser;
}

/**
 * Check if user is admin (no redirect)
 * Returns true/false
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);

  if (!profile) return false;

  return (
    profile.role === 'admin' ||
    profile.role === 'super_admin' ||
    profile.admin_role === 'moderator'
  );
}

/**
 * Check if user is super admin (no redirect)
 * Returns true/false
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role === 'super_admin';
}

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Check if user can edit specific content
 * Generic helper for ownership checks
 */
export async function canEdit(userId: string, ownerId: string): Promise<boolean> {
  if (userId === ownerId) return true;

  const adminStatus = await isAdmin(userId);
  return adminStatus;
}

/**
 * Check if user can delete specific content
 * Generic helper for deletion checks
 */
export async function canDelete(userId: string, ownerId: string): Promise<boolean> {
  if (userId === ownerId) return true;

  const adminStatus = await isAdmin(userId);
  return adminStatus;
}

/**
 * Redirect authenticated users away from auth pages
 * Use in login/register pages to prevent authenticated access
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getSession();

  if (user) {
    redirect(ROUTES.HOME);
  }
}
