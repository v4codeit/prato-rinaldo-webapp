'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { TopicMemberRole, TopicVisibility } from '@/types/topics';

// =============================================================================
// Types
// =============================================================================

interface UserInfo {
  id: string;
  tenant_id: string;
  role: string;
  committee_role: string | null;
  verification_status: string;
}

interface TopicInfo {
  id: string;
  visibility: TopicVisibility;
}

// =============================================================================
// Auto-Membership Functions
// =============================================================================

/**
 * Recalculate and sync topic membership for a user based on their current roles.
 *
 * Called when:
 * - User is verified (verification_status = 'approved')
 * - User role changes (becomes admin/super_admin)
 * - User gets committee_role (becomes board member)
 *
 * This function adds the user to all applicable topics where they're not already
 * a member, based on:
 * - Default topics (is_default = true)
 * - Topics matching their role (verified, admins_only, board_only)
 *
 * Note: members_only topics are NOT auto-joined (require manual selection)
 */
export async function syncUserTopicMembership(user: UserInfo): Promise<void> {
  const supabase = createAdminClient();

  console.log(`[AutoMembership] Syncing membership for user ${user.id}`);
  console.log(`[AutoMembership] User status: role=${user.role}, committee_role=${user.committee_role}, verification=${user.verification_status}`);

  // Build visibility conditions based on user's roles
  const visibilityConditions: string[] = [];

  // Always include default topics for verified users
  if (user.verification_status === 'approved') {
    visibilityConditions.push('is_default.eq.true');
    // Also include public, authenticated, and verified topics
    visibilityConditions.push('visibility.in.(public,authenticated,verified)');
  }

  // Admin users get access to admins_only topics
  if (['admin', 'super_admin'].includes(user.role)) {
    visibilityConditions.push('visibility.eq.admins_only');
  }

  // Board members (committee_role is set) get access to board_only topics
  if (user.committee_role) {
    visibilityConditions.push('visibility.eq.board_only');
  }

  if (visibilityConditions.length === 0) {
    console.log('[AutoMembership] No applicable visibility conditions for user');
    return;
  }

  console.log(`[AutoMembership] Checking topics with conditions: ${visibilityConditions.join(' OR ')}`);

  // Get topics where user should be auto-added
  // Excludes: hidden topics, members_only topics, archived topics
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, visibility')
    .eq('tenant_id', user.tenant_id)
    .eq('is_archived', false)
    .eq('is_hidden', false)
    .neq('visibility', 'members_only') // members_only = manual selection only
    .or(visibilityConditions.join(','));

  if (topicsError) {
    console.error('[AutoMembership] Error fetching topics:', topicsError);
    return;
  }

  if (!topics?.length) {
    console.log('[AutoMembership] No applicable topics found for user');
    return;
  }

  console.log(`[AutoMembership] Found ${topics.length} potentially applicable topics`);

  // Check existing memberships
  const { data: existingMemberships, error: membershipError } = await supabase
    .from('topic_members')
    .select('topic_id')
    .eq('user_id', user.id);

  if (membershipError) {
    console.error('[AutoMembership] Error checking existing memberships:', membershipError);
    return;
  }

  const existingTopicIds = new Set(existingMemberships?.map(m => m.topic_id) || []);

  // Filter to only topics where user is not already a member
  const topicsToJoin = topics.filter(t => !existingTopicIds.has(t.id));

  if (topicsToJoin.length === 0) {
    console.log('[AutoMembership] User already member of all applicable topics');
    return;
  }

  // Determine role for each topic
  const newMemberships = topicsToJoin.map((t: TopicInfo) => ({
    topic_id: t.id,
    user_id: user.id,
    role: determineRoleForTopic(t.visibility, user.role) as TopicMemberRole,
    unread_count: 0,
    last_read_at: new Date().toISOString(),
  }));

  // Insert new memberships
  const { error: insertError } = await supabase
    .from('topic_members')
    .insert(newMemberships);

  if (insertError) {
    console.error('[AutoMembership] Error adding user to topics:', insertError);
  } else {
    console.log(`[AutoMembership] Added user ${user.id} to ${newMemberships.length} topics`);
  }
}

/**
 * Determine the appropriate topic_member_role for a user joining a topic
 */
function determineRoleForTopic(topicVisibility: TopicVisibility, userRole: string): string {
  // Admins get admin role in topics
  if (['admin', 'super_admin'].includes(userRole)) {
    return 'admin';
  }

  // Everyone else gets writer role
  return 'writer';
}

/**
 * Helper to fetch user info and sync membership.
 * Use this when you only have the userId.
 */
export async function syncUserTopicMembershipById(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, tenant_id, role, committee_role, verification_status')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('[AutoMembership] User not found:', userId, error?.message);
    return;
  }

  await syncUserTopicMembership(user as UserInfo);
}

/**
 * Sync all users to a newly created topic based on its visibility.
 * Called when a topic is created with a visibility that should auto-add users.
 *
 * Note: Only adds users who match the visibility criteria.
 */
export async function syncTopicMembershipForNewTopic(
  topicId: string,
  tenantId: string,
  visibility: TopicVisibility
): Promise<void> {
  const supabase = createAdminClient();

  console.log(`[AutoMembership] Syncing users to new topic ${topicId} with visibility ${visibility}`);

  // members_only topics don't auto-add anyone
  if (visibility === 'members_only') {
    console.log('[AutoMembership] members_only topic - no auto-membership');
    return;
  }

  // Build user query based on visibility
  let userQuery = supabase
    .from('users')
    .select('id, role')
    .eq('tenant_id', tenantId);

  switch (visibility) {
    case 'public':
    case 'authenticated':
    case 'verified':
      // Add all verified users
      userQuery = userQuery.eq('verification_status', 'approved');
      break;
    case 'board_only':
      // Add users with committee_role
      userQuery = userQuery.not('committee_role', 'is', null);
      break;
    case 'admins_only':
      // Add admin users
      userQuery = userQuery.in('role', ['admin', 'super_admin']);
      break;
    default:
      console.log('[AutoMembership] Unknown visibility type:', visibility);
      return;
  }

  const { data: users, error: usersError } = await userQuery;

  if (usersError || !users?.length) {
    console.log('[AutoMembership] No users to add to topic:', usersError?.message || 'no users found');
    return;
  }

  // Get existing members (in case topic was created with some members)
  const { data: existingMembers } = await supabase
    .from('topic_members')
    .select('user_id')
    .eq('topic_id', topicId);

  const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);

  // Create memberships for users not already members
  const newMemberships = users
    .filter(u => !existingUserIds.has(u.id))
    .map(u => ({
      topic_id: topicId,
      user_id: u.id,
      role: (['admin', 'super_admin'].includes(u.role) ? 'admin' : 'writer') as TopicMemberRole,
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    }));

  if (newMemberships.length === 0) {
    console.log('[AutoMembership] All eligible users already members of topic');
    return;
  }

  const { error: insertError } = await supabase
    .from('topic_members')
    .insert(newMemberships);

  if (insertError) {
    console.error('[AutoMembership] Error adding users to topic:', insertError);
  } else {
    console.log(`[AutoMembership] Added ${newMemberships.length} users to topic ${topicId}`);
  }
}

/**
 * Re-sync topic membership when visibility changes.
 *
 * - Adds users who now qualify based on new visibility
 * - Removes users who no longer qualify, EXCEPT:
 *   - Topic admins (role='admin') are never auto-removed
 *   - Topic creator (created_by) is never auto-removed
 * - members_only: no auto-sync (admin manages manually)
 *
 * Called from updateTopic() when visibility field changes.
 */
export async function syncTopicMembershipOnVisibilityChange(
  topicId: string,
  tenantId: string,
  newVisibility: TopicVisibility,
  createdBy: string
): Promise<{ added: number; removed: number }> {
  const supabase = createAdminClient();

  console.log(`[AutoMembership] Syncing membership for topic ${topicId} after visibility change to ${newVisibility}`);

  // members_only = fully manual, no auto-sync
  if (newVisibility === 'members_only') {
    console.log('[AutoMembership] members_only visibility - skipping auto-sync');
    return { added: 0, removed: 0 };
  }

  // 1. Fetch target users based on new visibility
  let userQuery = supabase
    .from('users')
    .select('id, role')
    .eq('tenant_id', tenantId);

  switch (newVisibility) {
    case 'public':
    case 'authenticated':
    case 'verified':
      userQuery = userQuery.eq('verification_status', 'approved');
      break;
    case 'board_only':
      userQuery = userQuery.not('committee_role', 'is', null);
      break;
    case 'admins_only':
      userQuery = userQuery.in('role', ['admin', 'super_admin']);
      break;
    default:
      console.log('[AutoMembership] Unknown visibility type:', newVisibility);
      return { added: 0, removed: 0 };
  }

  const { data: targetUsers, error: usersError } = await userQuery;
  if (usersError) {
    console.error('[AutoMembership] Error fetching target users:', usersError);
    return { added: 0, removed: 0 };
  }

  const targetUserIds = new Set((targetUsers || []).map(u => u.id));
  const targetUserRoleMap = new Map((targetUsers || []).map(u => [u.id, u.role]));

  // 2. Fetch current members with their roles
  const { data: currentMembers, error: membersError } = await supabase
    .from('topic_members')
    .select('user_id, role')
    .eq('topic_id', topicId);

  if (membersError) {
    console.error('[AutoMembership] Error fetching current members:', membersError);
    return { added: 0, removed: 0 };
  }

  const currentMemberMap = new Map(
    (currentMembers || []).map(m => [m.user_id, m.role as string])
  );

  // 3. Determine protected users (never auto-remove)
  const protectedUserIds = new Set<string>();
  protectedUserIds.add(createdBy);
  for (const [userId, role] of currentMemberMap) {
    if (role === 'admin') {
      protectedUserIds.add(userId);
    }
  }

  // 4. Compute additions (in target set, not already a member)
  const toAddUserIds = [...targetUserIds].filter(id => !currentMemberMap.has(id));

  // 5. Compute removals (current member, not in target set, not protected)
  const toRemoveUserIds = [...currentMemberMap.keys()].filter(
    id => !targetUserIds.has(id) && !protectedUserIds.has(id)
  );

  console.log(`[AutoMembership] Visibility change diff: +${toAddUserIds.length} members, -${toRemoveUserIds.length} members`);

  let added = 0;
  let removed = 0;

  // 6. Batch insert new members
  if (toAddUserIds.length > 0) {
    const newMemberships = toAddUserIds.map(userId => ({
      topic_id: topicId,
      user_id: userId,
      role: determineRoleForTopic(newVisibility, targetUserRoleMap.get(userId) || 'user') as TopicMemberRole,
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('topic_members')
      .insert(newMemberships);

    if (insertError) {
      console.error('[AutoMembership] Error adding members on visibility change:', insertError);
    } else {
      added = newMemberships.length;
      console.log(`[AutoMembership] Added ${added} members to topic ${topicId}`);
    }
  }

  // 7. Batch remove members who no longer qualify
  if (toRemoveUserIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('topic_members')
      .delete()
      .eq('topic_id', topicId)
      .in('user_id', toRemoveUserIds);

    if (deleteError) {
      console.error('[AutoMembership] Error removing members on visibility change:', deleteError);
    } else {
      removed = toRemoveUserIds.length;
      console.log(`[AutoMembership] Removed ${removed} members from topic ${topicId}`);
    }
  }

  return { added, removed };
}
