'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  addTopicMemberSchema,
  updateTopicMemberRoleSchema,
  updateTopicSubscriptionSchema,
} from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import type {
  TopicMember,
  TopicMemberWithUser,
  TopicMemberRole,
  ActionResponse,
  AddMemberInput,
} from '@/types/topics';

/**
 * Get members of a topic
 */
export async function getTopicMembers(
  topicId: string
): Promise<ActionResponse<TopicMemberWithUser[]>> {
  try {
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from('topic_members')
      .select('*, user:users!user_id(id, name, email, avatar)')
      .eq('topic_id', topicId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return { data: null, error: 'Errore nel caricamento dei membri' };
    }

    return { data: members as TopicMemberWithUser[], error: null };
  } catch (err) {
    console.error('Exception in getTopicMembers:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Add a member to a topic (admin only)
 */
export async function addTopicMember(
  topicId: string,
  input: AddMemberInput
): Promise<ActionResponse<TopicMember>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validate
    const parsed = addTopicMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    // Check admin permissions
    const { data: currentMember } = await supabase
      .from('topic_members')
      .select('role')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isTopicAdmin = currentMember?.role === 'admin';
    const isPlatformAdmin = userData && ['admin', 'super_admin'].includes(userData.role);

    if (!isTopicAdmin && !isPlatformAdmin) {
      return { data: null, error: 'Non autorizzato' };
    }

    // Find target user
    let targetUserId = input.userId;
    if (!targetUserId && input.email) {
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .single();

      if (!targetUser) {
        return { data: null, error: 'Utente non trovato' };
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return { data: null, error: 'Specifica utente' };
    }

    // Add member
    const { data: member, error } = await supabase
      .from('topic_members')
      .insert({
        topic_id: topicId,
        user_id: targetUserId,
        role: input.role,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'Utente già membro' };
      }
      console.error('Error adding member:', error);
      return { data: null, error: 'Errore nell\'aggiunta del membro' };
    }

    revalidatePath(ROUTES.COMMUNITY);

    return { data: member as TopicMember, error: null };
  } catch (err) {
    console.error('Exception in addTopicMember:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Remove a member from a topic (admin only)
 */
export async function removeTopicMember(
  topicId: string,
  targetUserId: string
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Check permissions
    const { data: currentMember } = await supabase
      .from('topic_members')
      .select('role')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isTopicAdmin = currentMember?.role === 'admin';
    const isPlatformAdmin = userData && ['admin', 'super_admin'].includes(userData.role);
    const isSelf = targetUserId === user.id;

    if (!isTopicAdmin && !isPlatformAdmin && !isSelf) {
      return { data: null, error: 'Non autorizzato' };
    }

    const { error } = await supabase
      .from('topic_members')
      .delete()
      .eq('topic_id', topicId)
      .eq('user_id', targetUserId);

    if (error) {
      console.error('Error removing member:', error);
      return { data: null, error: 'Errore nella rimozione' };
    }

    revalidatePath(ROUTES.COMMUNITY);

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in removeTopicMember:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Update member role (admin only)
 */
export async function updateMemberRole(
  topicId: string,
  targetUserId: string,
  role: TopicMemberRole
): Promise<ActionResponse<TopicMember>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validate
    const parsed = updateTopicMemberRoleSchema.safeParse({ role });
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message };
    }

    // Check permissions
    const { data: currentMember } = await supabase
      .from('topic_members')
      .select('role')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isTopicAdmin = currentMember?.role === 'admin';
    const isPlatformAdmin = userData && ['admin', 'super_admin'].includes(userData.role);

    if (!isTopicAdmin && !isPlatformAdmin) {
      return { data: null, error: 'Non autorizzato' };
    }

    const { data: member, error } = await supabase
      .from('topic_members')
      .update({ role: parsed.data.role })
      .eq('topic_id', topicId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return { data: null, error: 'Errore nell\'aggiornamento del ruolo' };
    }

    revalidatePath(ROUTES.COMMUNITY);

    return { data: member as TopicMember, error: null };
  } catch (err) {
    console.error('Exception in updateMemberRole:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Join a topic (self)
 */
export async function joinTopic(topicId: string): Promise<ActionResponse<TopicMember>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    const { data: member, error } = await supabase
      .from('topic_members')
      .insert({
        topic_id: topicId,
        user_id: user.id,
        role: 'writer',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'Sei già membro' };
      }
      if (error.code === '42501') {
        return { data: null, error: 'Non puoi unirti a questo topic' };
      }
      console.error('Error joining topic:', error);
      return { data: null, error: 'Errore' };
    }

    revalidatePath(ROUTES.COMMUNITY);

    return { data: member as TopicMember, error: null };
  } catch (err) {
    console.error('Exception in joinTopic:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Leave a topic (self)
 */
export async function leaveTopic(topicId: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    const { error } = await supabase
      .from('topic_members')
      .delete()
      .eq('topic_id', topicId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving topic:', error);
      return { data: null, error: 'Errore' };
    }

    revalidatePath(ROUTES.COMMUNITY);

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in leaveTopic:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}

/**
 * Toggle mute for a topic
 */
export async function toggleTopicMute(
  topicId: string,
  muted: boolean
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Non autenticato' };
    }

    const { error } = await supabase
      .from('topic_members')
      .update({ is_muted: muted })
      .eq('topic_id', topicId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling mute:', error);
      return { data: null, error: 'Errore' };
    }

    return { data: null, error: null };
  } catch (err) {
    console.error('Exception in toggleTopicMute:', err);
    return { data: null, error: 'Errore imprevisto' };
  }
}
