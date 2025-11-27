'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTopicSchema, updateTopicSchema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import type {
  Topic,
  TopicWithUnread,
  TopicMember,
  TopicMemberWithUser,
  TopicMemberRole,
  ActionResponse,
  CreateTopicInput,
  UpdateTopicInput,
} from '@/types/topics';

/**
 * Generate slug from topic name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Remove consecutive -
    .slice(0, 100);
}

/**
 * Get all accessible topics for the current user with unread counts
 */
export async function getTopics(
  options?: { includeArchived?: boolean }
): Promise<ActionResponse<TopicWithUnread[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Build base query - RLS will handle visibility
    let query = supabase
      .from('topics')
      .select('*')
      .order('order_index', { ascending: true })
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: topics, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      return { data: null, error: 'Errore nel caricamento dei topics' };
    }

    // If user is authenticated, get their membership info
    let memberships: TopicMember[] = [];
    if (user) {
      const { data: memberData } = await supabase
        .from('topic_members')
        .select('*')
        .eq('user_id', user.id);

      memberships = (memberData || []) as TopicMember[];
    }

    // Merge topics with membership info
    const topicsWithUnread: TopicWithUnread[] = (topics || []).map((topic) => {
      const membership = memberships.find((m) => m.topic_id === topic.id);
      return {
        ...topic,
        unread_count: membership?.unread_count || 0,
        is_member: !!membership,
        my_role: membership?.role || null,
      } as TopicWithUnread;
    });

    return { data: topicsWithUnread, error: null };
  } catch (err) {
    console.error('Exception in getTopics:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Get a single topic by slug
 */
export async function getTopicBySlug(
  slug: string
): Promise<ActionResponse<TopicWithUnread>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: topic, error } = await supabase
      .from('topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !topic) {
      return { data: null, error: 'Topic non trovato' };
    }

    // Get membership info if authenticated
    let membership: TopicMember | null = null;
    if (user) {
      const { data: memberData } = await supabase
        .from('topic_members')
        .select('*')
        .eq('topic_id', topic.id)
        .eq('user_id', user.id)
        .single();

      membership = memberData as TopicMember | null;
    }

    const topicWithUnread: TopicWithUnread = {
      ...topic,
      unread_count: membership?.unread_count || 0,
      is_member: !!membership,
      my_role: membership?.role || null,
    } as TopicWithUnread;

    return { data: topicWithUnread, error: null };
  } catch (err) {
    console.error('Exception in getTopicBySlug:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Get a single topic by ID
 */
export async function getTopicById(
  topicId: string
): Promise<ActionResponse<TopicWithUnread>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: topic, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (error || !topic) {
      return { data: null, error: 'Topic non trovato' };
    }

    // Get membership info if authenticated
    let membership: TopicMember | null = null;
    if (user) {
      const { data: memberData } = await supabase
        .from('topic_members')
        .select('*')
        .eq('topic_id', topic.id)
        .eq('user_id', user.id)
        .single();

      membership = memberData as TopicMember | null;
    }

    const topicWithUnread: TopicWithUnread = {
      ...topic,
      unread_count: membership?.unread_count || 0,
      is_member: !!membership,
      my_role: membership?.role || null,
    } as TopicWithUnread;

    return { data: topicWithUnread, error: null };
  } catch (err) {
    console.error('Exception in getTopicById:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Create a new topic (admin only)
 */
export async function createTopic(
  input: CreateTopicInput
): Promise<ActionResponse<Topic>> {
  try {
    const supabase = await createClient();

    // Verify admin status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Validate input
    const parsed = createTopicSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    const { name, description, icon, color, visibility, writePermission, autoPostSource, autoPostFilter } =
      parsed.data;

    // Generate slug if not provided
    const slug = input.slug || generateSlug(name);

    // Check if slug is unique
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('tenant_id', userData.tenant_id)
      .eq('slug', slug)
      .single();

    if (existingTopic) {
      return { data: null, error: 'Uno slug con questo nome esiste già' };
    }

    // Create topic
    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        tenant_id: userData.tenant_id,
        name,
        slug,
        description,
        icon,
        color,
        visibility,
        write_permission: writePermission,
        auto_post_source: autoPostSource || null,
        auto_post_filter: autoPostFilter || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating topic:', error);
      return { data: null, error: 'Errore nella creazione del topic' };
    }

    // Add creator as admin member
    await supabase.from('topic_members').insert({
      topic_id: topic.id,
      user_id: user.id,
      role: 'admin',
      added_by: user.id,
    });

    revalidatePath(ROUTES.COMMUNITY);
    revalidatePath('/admin/community');

    return { data: topic as Topic, error: null };
  } catch (err) {
    console.error('Exception in createTopic:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Update an existing topic (admin only)
 */
export async function updateTopic(
  topicId: string,
  input: UpdateTopicInput
): Promise<ActionResponse<Topic>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Validate input
    const parsed = updateTopicSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    // Check topic exists and belongs to tenant
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!existingTopic) {
      return { data: null, error: 'Topic non trovato' };
    }

    // Prevent modifying default topic's critical settings
    if (existingTopic.is_default && input.visibility) {
      // Default topic must remain public
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.writePermission !== undefined) updateData.write_permission = input.writePermission;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    const { data: topic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', topicId)
      .select()
      .single();

    if (error) {
      console.error('Error updating topic:', error);
      return { data: null, error: 'Errore nell\'aggiornamento del topic' };
    }

    revalidatePath(ROUTES.COMMUNITY);
    revalidatePath(`/community/${existingTopic.slug}`);
    revalidatePath('/admin/community');

    return { data: topic as Topic, error: null };
  } catch (err) {
    console.error('Exception in updateTopic:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Delete a topic - admin only
 */
export async function deleteTopic(topicId: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Check topic exists and is not default
    const { data: topic } = await supabase
      .from('topics')
      .select('id, is_default, slug')
      .eq('id', topicId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!topic) {
      return { data: null, error: 'Topic non trovato' };
    }

    if (topic.is_default) {
      return { data: null, error: 'Non puoi eliminare il topic di default' };
    }

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      console.error('Error deleting topic:', error);
      return { data: null, error: 'Errore nell\'eliminazione del topic' };
    }

    revalidatePath(ROUTES.COMMUNITY);
    revalidatePath('/admin/community');

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in deleteTopic:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Get total unread count across all topics for current user
 */
export async function getTotalUnreadCount(): Promise<ActionResponse<number>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: 0, error: null };
    }

    const { data: memberships, error } = await supabase
      .from('topic_members')
      .select('unread_count')
      .eq('user_id', user.id)
      .eq('is_muted', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return { data: 0, error: null };
    }

    const total = (memberships || []).reduce(
      (sum, m) => sum + (m.unread_count || 0),
      0
    );

    return { data: total, error: null };
  } catch (err) {
    console.error('Exception in getTotalUnreadCount:', err);
    return { data: 0, error: null };
  }
}
