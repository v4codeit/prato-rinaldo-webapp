'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  category: string;
  description?: string;
  tenant_id: string;
}

// Helper: Get tenant ID from logged-in user
async function getTenantIdFromUser(): Promise<{ tenantId: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { tenantId: null, error: 'User not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!userProfile || !userProfile.tenant_id) {
    return { tenantId: null, error: 'Tenant not found for user' };
  }

  return { tenantId: userProfile.tenant_id, error: null };
}

// Get settings by category (filtered by tenant)
export async function getSettingsByCategory(category: string) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { settings: [], error: tenantError || 'Tenant ID not found' };
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('category', category);

  if (error) {
    return { settings: [], error: error.message };
  }

  return { settings: data || [] };
}

// Get single setting by key (filtered by tenant)
export async function getSetting(key: string) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { setting: null, error: tenantError || 'Tenant ID not found' };
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('key', key)
    .single();

  if (error) {
    return { setting: null, error: error.message };
  }

  return { setting: data };
}

// Admin: Update setting (filtered by tenant)
export async function updateSetting(key: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { setting: null, error: tenantError || 'Tenant ID not found' };
  }

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      value,
      updated_by: user?.id,
    })
    .eq('tenant_id', tenantId)
    .eq('key', key)
    .select()
    .single();

  if (error) {
    return { setting: null, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { setting: data };
}

// Admin: Bulk update settings (filtered by tenant)
export async function updateMultipleSettings(updates: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  const promises = Object.entries(updates).map(([key, value]) =>
    supabase
      .from('site_settings')
      .update({
        value,
        updated_by: user?.id,
      })
      .eq('tenant_id', tenantId)
      .eq('key', key)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    return { success: false, error: 'Some updates failed' };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}
