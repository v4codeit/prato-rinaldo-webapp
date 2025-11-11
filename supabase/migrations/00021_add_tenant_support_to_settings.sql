-- =====================================================
-- Migration: Add Tenant Support to Settings
-- =====================================================
-- This migration adds multi-tenant support to site_settings
-- and adds missing fields to tenants table for resource limits
-- and module management.
-- =====================================================

-- Step 1: Add missing fields to tenants table
-- =====================================================

-- Add resource limits
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 5000 NOT NULL;

-- Add module management (JSON array of enabled module names)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '["marketplace", "events", "bacheca", "agora", "resources", "community_pro"]'::jsonb NOT NULL;

-- Add accent color for theme (completing the color palette)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#8b5cf6';

COMMENT ON COLUMN tenants.max_users IS 'Maximum number of users allowed for this tenant';
COMMENT ON COLUMN tenants.max_storage_mb IS 'Maximum storage in MB allowed for this tenant';
COMMENT ON COLUMN tenants.enabled_modules IS 'JSON array of enabled module names';
COMMENT ON COLUMN tenants.accent_color IS 'Accent color for theme (completes primary/secondary/accent palette)';

-- Step 2: Modify site_settings table for multi-tenancy
-- =====================================================

-- Add tenant_id column (nullable initially for migration)
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Get the default tenant (usually 'prato-rinaldo' based on env)
-- For migration, assign all existing settings to the default tenant
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get the first active tenant (or prato-rinaldo if exists)
  SELECT id INTO default_tenant_id
  FROM tenants
  WHERE slug = 'prato-rinaldo'
     OR is_active = true
  ORDER BY
    CASE WHEN slug = 'prato-rinaldo' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1;

  -- Assign existing settings to default tenant
  IF default_tenant_id IS NOT NULL THEN
    UPDATE site_settings
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Now make tenant_id NOT NULL and add foreign key
ALTER TABLE site_settings
ALTER COLUMN tenant_id SET NOT NULL,
ADD CONSTRAINT fk_site_settings_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES tenants(id)
  ON DELETE CASCADE;

-- Step 3: Update indexes and constraints
-- =====================================================

-- Drop old unique index on key
DROP INDEX IF EXISTS idx_site_settings_key;

-- Create new composite unique index (tenant_id + key)
CREATE UNIQUE INDEX idx_site_settings_tenant_key
  ON site_settings(tenant_id, key);

-- Add index on tenant_id for faster lookups
CREATE INDEX idx_site_settings_tenant_id
  ON site_settings(tenant_id);

-- Update category index (keeping existing)
DROP INDEX IF EXISTS idx_site_settings_category;
CREATE INDEX idx_site_settings_tenant_category
  ON site_settings(tenant_id, category);

-- Step 4: Update RLS Policies
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;

-- New policy: Users can read settings for their tenant
CREATE POLICY "Users can read their tenant settings"
  ON site_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- New policy: Admins can manage settings for their tenant only
CREATE POLICY "Admins can manage their tenant settings"
  ON site_settings FOR ALL
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin')
    )
  );

-- Step 5: Seed general category settings
-- =====================================================

-- This function will insert general settings for each tenant
-- Run it manually for existing tenants or automatically for new ones

CREATE OR REPLACE FUNCTION seed_general_settings_for_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO site_settings (tenant_id, key, value, category, description) VALUES
    -- Basic Site Info
    (p_tenant_id, 'site_name', '', 'general', 'Nome del sito'),
    (p_tenant_id, 'site_description', '', 'general', 'Descrizione breve del sito'),
    (p_tenant_id, 'site_logo', '', 'general', 'URL del logo principale del sito'),
    (p_tenant_id, 'site_favicon', '', 'general', 'URL del favicon'),

    -- Theme Colors
    (p_tenant_id, 'theme_primary_color', '#0891b2', 'general', 'Colore primario del tema'),
    (p_tenant_id, 'theme_secondary_color', '#f97316', 'general', 'Colore secondario del tema'),
    (p_tenant_id, 'theme_accent_color', '#8b5cf6', 'general', 'Colore accent del tema'),

    -- SEO Settings
    (p_tenant_id, 'seo_title', '', 'general', 'Titolo SEO (meta title)'),
    (p_tenant_id, 'seo_description', '', 'general', 'Descrizione SEO (meta description)'),
    (p_tenant_id, 'seo_keywords', '', 'general', 'Keywords SEO (separate da virgola)'),

    -- Contact Information
    (p_tenant_id, 'contact_email', '', 'general', 'Email di contatto pubblica'),
    (p_tenant_id, 'contact_phone', '', 'general', 'Telefono di contatto pubblico'),
    (p_tenant_id, 'contact_address', '', 'general', 'Indirizzo fisico')
  ON CONFLICT (tenant_id, key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_general_settings_for_tenant IS 'Seeds general category settings for a specific tenant';

-- Seed general settings for all existing tenants
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    PERFORM seed_general_settings_for_tenant(tenant_record.id);
  END LOOP;
END $$;

-- Step 6: Create trigger to auto-seed settings for new tenants
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_settings_for_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Seed general settings when a new tenant is created
  PERFORM seed_general_settings_for_tenant(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_seed_settings_for_new_tenant
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_settings_for_new_tenant();

COMMENT ON TRIGGER trigger_seed_settings_for_new_tenant ON tenants IS 'Automatically seeds general settings when a new tenant is created';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary of changes:
-- 1. Added max_users, max_storage_mb, enabled_modules, accent_color to tenants
-- 2. Added tenant_id to site_settings with FK constraint
-- 3. Updated unique constraint from (key) to (tenant_id, key)
-- 4. Updated RLS policies to filter by tenant_id
-- 5. Seeded general category settings for all existing tenants
-- 6. Created auto-seeding trigger for new tenants
-- =====================================================
