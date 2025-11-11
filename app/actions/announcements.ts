'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Announcement {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  emoji?: string;
  link?: string;
  is_active: boolean;
  priority: number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Get active announcement (singolo con priority più alta)
export async function getActiveAnnouncement() {
  const supabase = await createClient();

  // RLS policies already filter by tenant_id automatically
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

  if (error) {
    console.error('Error fetching announcement:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { announcement: null };
  }

  // Additional filter for date range in application layer
  const announcement = data as Announcement | null;
  if (announcement) {
    const now = new Date();
    if (announcement.start_date && new Date(announcement.start_date) > now) {
      return { announcement: null };
    }
    if (announcement.end_date && new Date(announcement.end_date) < now) {
      return { announcement: null };
    }
  }

  return { announcement };
}

// Admin: Get all announcements
export async function getAllAnnouncements() {
  const supabase = await createClient();

  // RLS policies already filter by tenant_id automatically
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all announcements:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { announcements: [], error: error.message };
  }

  return { announcements: data || [] };
}

// Admin: Create announcement
export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { announcement: null, error: 'User not authenticated' };
  }

  // Get user's tenant_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const validUserData = userData as { tenant_id: string } | null;

  if (userError || !validUserData?.tenant_id) {
    console.error('Error fetching user tenant:', {
      message: userError?.message,
      code: userError?.code,
      details: userError?.details,
      hint: userError?.hint,
    });
    return { announcement: null, error: 'Unable to determine user tenant' };
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcement,
      tenant_id: validUserData.tenant_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { announcement: null, error: error.message };
  }

  revalidatePath('/admin/announcements');
  return { announcement: data };
}

// Admin: Update announcement
export async function updateAnnouncement(id: string, updates: Partial<Omit<Announcement, 'id' | 'tenant_id' | 'created_by' | 'created_at'>>) {
  const supabase = await createClient();

  // RLS policies will ensure user can only update announcements in their tenant
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating announcement:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { announcement: null, error: error.message };
  }

  revalidatePath('/admin/announcements');
  return { announcement: data };
}

// Admin: Delete announcement
export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  // RLS policies will ensure user can only delete announcements in their tenant
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/announcements');
  return { success: true };
}
