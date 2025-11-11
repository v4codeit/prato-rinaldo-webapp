'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Database } from '@/lib/supabase/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

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

// Get tenant settings
export async function getTenantSettings(): Promise<{ tenant: Tenant | null; error?: string }> {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { tenant: null, error: tenantError || 'Tenant ID not found' };
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single() as { data: Tenant | null; error: any };

  if (error) {
    return { tenant: null, error: error.message };
  }

  return { tenant: data, error: undefined };
}

// Get social links from tenant (helper for social settings form)
export async function getTenantSocialLinks() {
  const { tenant, error } = await getTenantSettings();

  if (error || !tenant) {
    return {
      facebook: '',
      instagram: '',
      twitter: '',
      error: error || 'Tenant not found',
    };
  }

  return {
    facebook: tenant.social_facebook || '',
    instagram: tenant.social_instagram || '',
    twitter: tenant.social_twitter || '',
    error: null,
  };
}

// Admin: Update tenant basic info (name, description, contact)
export async function updateTenantBasicInfo(data: {
  name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const updateData: TenantUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.contact_email !== undefined) updateData.contact_email = data.contact_email;
  if (data.contact_phone !== undefined) updateData.contact_phone = data.contact_phone;
  if (data.address !== undefined) updateData.address = data.address;

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

// Admin: Update tenant branding (logo, colors)
export async function updateTenantBranding(data: {
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  hero_image?: string;
}) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const updateData: TenantUpdate = {};
  if (data.logo !== undefined) updateData.logo = data.logo;
  if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
  if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
  if (data.accent_color !== undefined) updateData.accent_color = data.accent_color;
  if (data.hero_image !== undefined) updateData.hero_image = data.hero_image;

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/'); // Revalidate homepage for logo/colors
  return { success: true };
}

// Admin: Update tenant social links
export async function updateTenantSocialLinks(data: {
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
}) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const updateData: TenantUpdate = {};
  if (data.social_facebook !== undefined) updateData.social_facebook = data.social_facebook;
  if (data.social_instagram !== undefined) updateData.social_instagram = data.social_instagram;
  if (data.social_twitter !== undefined) updateData.social_twitter = data.social_twitter;

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

// Admin: Update tenant resource limits
export async function updateTenantLimits(data: {
  max_users?: number;
  max_storage_mb?: number;
}) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const updateData: TenantUpdate = {};
  if (data.max_users !== undefined) updateData.max_users = data.max_users;
  if (data.max_storage_mb !== undefined) updateData.max_storage_mb = data.max_storage_mb;

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

// Admin: Update enabled modules
export async function updateTenantModules(enabledModules: string[]) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const { error } = await supabase
    .from('tenants')
    .update({ enabled_modules: enabledModules })
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

// Admin: Toggle maintenance mode
export async function toggleMaintenanceMode(enabled: boolean, message?: string) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const { error } = await supabase
    .from('tenants')
    .update({
      maintenance_mode: enabled,
      maintenance_message: enabled ? (message || 'Site under maintenance') : null,
    })
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/'); // Revalidate all pages for maintenance mode
  return { success: true };
}

// Admin: Bulk update tenant settings (combined update)
export async function updateTenantSettings(data: TenantUpdate) {
  const supabase = await createClient();
  const { tenantId, error: tenantError } = await getTenantIdFromUser();

  if (tenantError || !tenantId) {
    return { success: false, error: tenantError || 'Tenant ID not found' };
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const { error } = await supabase
    .from('tenants')
    .update(data)
    .eq('id', tenantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/settings');
  return { success: true };
}
