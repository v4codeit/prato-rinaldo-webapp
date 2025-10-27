'use server';

import { createClient } from '@/lib/supabase/server';
import { COMMITTEE_ROLES } from './constants';

/**
 * Check if user is a board member (has any committee role)
 */
export async function isBoardMember(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('users')
    .select('committee_role')
    .eq('id', userId)
    .single() as { data: { committee_role: string | null } | null };

  return data?.committee_role !== null;
}

/**
 * Check if user is the President
 */
export async function isPresident(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('users')
    .select('committee_role')
    .eq('id', userId)
    .single() as { data: { committee_role: string | null } | null };

  return data?.committee_role === COMMITTEE_ROLES.PRESIDENT;
}

/**
 * Check if user can delete an event
 * Can delete if: creator OR president
 */
export async function canDeleteEvent(userId: string, eventOrganizerId: string): Promise<boolean> {
  if (userId === eventOrganizerId) return true; // Creator
  return await isPresident(userId); // President
}