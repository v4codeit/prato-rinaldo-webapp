'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Share2, Building } from 'lucide-react';
import { GeneralSettingsForm } from '@/components/admin/general-settings-form';
import { SocialSettingsForm } from '@/components/admin/social-settings-form';
import { TenantSettingsForm } from '@/components/admin/tenant-settings-form';

interface SettingsClientProps {
  generalSettings: {
    site_name: string;
    site_description: string;
    site_logo: string;
    site_favicon: string;
    theme_primary_color: string;
    theme_secondary_color: string;
    theme_accent_color: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
  };
  tenantSettings: {
    logo: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    max_users: number;
    max_storage_mb: number;
    enabled_modules: string[];
    maintenance_mode: boolean;
    maintenance_message: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

export function SettingsClient({ generalSettings, tenantSettings, socialLinks }: SettingsClientProps) {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      {/* Tabs List */}
      <TabsList className="grid w-full md:w-auto grid-cols-3">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Generale</span>
          <span className="sm:hidden">Gen</span>
        </TabsTrigger>
        <TabsTrigger value="social" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Social</span>
          <span className="sm:hidden">Soc</span>
        </TabsTrigger>
        <TabsTrigger value="tenant" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span className="hidden sm:inline">Tenant</span>
          <span className="sm:hidden">Ten</span>
        </TabsTrigger>
      </TabsList>

      {/* General Settings Tab */}
      <TabsContent value="general">
        <GeneralSettingsForm initialValues={generalSettings} />
      </TabsContent>

      {/* Social Settings Tab */}
      <TabsContent value="social">
        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>
              Configura i link ai profili social del tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SocialSettingsForm initialValues={socialLinks} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tenant Settings Tab */}
      <TabsContent value="tenant">
        <TenantSettingsForm initialValues={tenantSettings} />
      </TabsContent>
    </Tabs>
  );
}
