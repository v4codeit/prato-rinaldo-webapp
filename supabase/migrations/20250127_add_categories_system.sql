-- =====================================================
-- Migration: Add Categories System for Events & Marketplace
-- Date: 2025-01-27
-- Description: Dynamic category management for both events and marketplace items
-- =====================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('event', 'marketplace_item')),
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_slug_per_type UNIQUE(slug, item_type, tenant_id)
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(item_type);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

-- Add category_id foreign key to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Add category_id foreign key to marketplace_items table
ALTER TABLE marketplace_items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read active categories" ON categories;
DROP POLICY IF EXISTS "Admin manage categories" ON categories;

-- RLS Policy: Anyone can read active categories
CREATE POLICY "Public read active categories" ON categories
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Only admins can insert/update/delete categories
CREATE POLICY "Admin manage categories" ON categories
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Seed initial event categories
INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Assemblea', 'assemblea', 'event', 1, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Festa/Evento Sociale', 'festa', 'event', 2, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Manutenzione', 'manutenzione', 'event', 3, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Sport/Cultura', 'sport_cultura', 'event', 4, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

-- Seed initial marketplace categories
INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Elettronica', 'elettronica', 'marketplace_item', 1, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Casa e Giardino', 'casa', 'marketplace_item', 2, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Abbigliamento', 'abbigliamento', 'marketplace_item', 3, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Sport e Tempo Libero', 'sport', 'marketplace_item', 4, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Libri e Riviste', 'libri', 'marketplace_item', 5, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Mobili', 'mobili', 'marketplace_item', 6, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

INSERT INTO categories (name, slug, item_type, display_order, tenant_id)
SELECT 'Altro', 'altro', 'marketplace_item', 7, id FROM tenants LIMIT 1
ON CONFLICT (slug, item_type, tenant_id) DO NOTHING;

-- Optional: Migrate existing hardcoded categories if they exist
-- Uncomment if events/marketplace_items have a 'category' string column

-- UPDATE events e
-- SET category_id = c.id
-- FROM categories c
-- WHERE e.category = c.slug
--   AND c.item_type = 'event'
--   AND e.category_id IS NULL;

-- UPDATE marketplace_items m
-- SET category_id = c.id
-- FROM categories c
-- WHERE m.category = c.slug
--   AND c.item_type = 'marketplace_item'
--   AND m.category_id IS NULL;

-- Create update timestamp trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE categories IS 'Dynamic categories for events and marketplace items';
COMMENT ON COLUMN categories.item_type IS 'Type of item this category applies to: event or marketplace_item';
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories in UI (lower = first)';
COMMENT ON COLUMN categories.is_active IS 'Whether this category is currently active and visible';
