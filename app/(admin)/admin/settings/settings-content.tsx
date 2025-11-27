import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettingsByCategory, type SiteSetting } from '@/app/actions/site-settings';
import { getTenantSettings } from '@/app/actions/tenant-settings';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { SettingsClient } from './settings-client';

export async function SettingsContent() {
  await connection(); // Force dynamic rendering - MUST be first

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch general settings from site_settings
  const { settings: generalSettingsRaw } = await getSettingsByCategory('general');
  const generalSettings = generalSettingsRaw as SiteSetting[];

  // Helper to get setting value by key
  const getSetting = (key: string) => generalSettings.find(s => s.key === key)?.value || '';

  const generalSettingsData = {
    site_name: getSetting('site_name'),
    site_description: getSetting('site_description'),
    site_logo: getSetting('site_logo'),
    site_favicon: getSetting('site_favicon'),
    theme_primary_color: getSetting('theme_primary_color') || '#0891b2',
    theme_secondary_color: getSetting('theme_secondary_color') || '#f97316',
    theme_accent_color: getSetting('theme_accent_color') || '#8b5cf6',
    seo_title: getSetting('seo_title'),
    seo_description: getSetting('seo_description'),
    seo_keywords: getSetting('seo_keywords'),
    contact_email: getSetting('contact_email'),
    contact_phone: getSetting('contact_phone'),
    contact_address: getSetting('contact_address'),
  };

  // Fetch tenant settings from tenants table
  const tenantResult = await getTenantSettings();

  if (tenantResult.error || !tenantResult.tenant) {
    return (
      <AdminPageLayout
        title="Impostazioni Sito"
        description="Gestisci le impostazioni generali, social e tenant"
      >
        <div className="text-center py-12">
          <p className="text-destructive">Errore: {tenantResult.error || 'Tenant non trovato'}</p>
        </div>
      </AdminPageLayout>
    );
  }

  // Type narrowing: at this point tenant is guaranteed to exist
  const tenant = tenantResult.tenant!;

  const tenantSettingsData = {
    logo: tenant.logo || '',
    primary_color: tenant.primary_color || '#0891b2',
    secondary_color: tenant.secondary_color || '#f97316',
    accent_color: tenant.accent_color || '#8b5cf6',
    max_users: tenant.max_users,
    max_storage_mb: tenant.max_storage_mb,
    enabled_modules: (tenant.enabled_modules as string[]) || [],
    maintenance_mode: tenant.maintenance_mode,
    maintenance_message: tenant.maintenance_message || '',
  };

  const socialLinksData = {
    facebook: tenant.social_facebook || '',
    instagram: tenant.social_instagram || '',
    twitter: tenant.social_twitter || '',
  };

  return (
    <AdminPageLayout>
      <div className="max-w-4xl mx-auto">
        <SettingsClient
          generalSettings={generalSettingsData}
          tenantSettings={tenantSettingsData}
          socialLinks={socialLinksData}
        />
      </div>
    </AdminPageLayout>
  );
}
