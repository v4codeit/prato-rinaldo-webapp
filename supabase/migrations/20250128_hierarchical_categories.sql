-- =====================================================
-- Migration: Hierarchical Categories for Marketplace
-- Date: 2025-01-28
-- Description: Add parent_id for subcategories, macro_type for filtering,
--              and custom_input_allowed for "Altro" categories
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS TO categories TABLE
-- =====================================================

-- Add parent_id for hierarchical categories (subcategories)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Add macro_type for filtering by announcement type (objects vs real estate)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS macro_type VARCHAR(50) CHECK (macro_type IN ('objects', 'real_estate'));

-- Add custom_input_allowed for "Altro" categories that allow free text input
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS custom_input_allowed BOOLEAN DEFAULT false;

-- =====================================================
-- 2. ADD CONSTRAINT TO PREVENT SELF-REFERENCE
-- =====================================================

ALTER TABLE categories
  ADD CONSTRAINT no_self_reference CHECK (id != parent_id);

-- =====================================================
-- 3. CREATE INDICES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_macro_type ON categories(macro_type);
CREATE INDEX IF NOT EXISTS idx_categories_type_macro ON categories(item_type, macro_type);

-- =====================================================
-- 4. UPDATE UNIQUE CONSTRAINT TO INCLUDE parent_id
-- =====================================================

-- Drop old constraint and create new one that includes parent_id
-- This allows same slug for different parent categories
ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS unique_slug_per_type;

ALTER TABLE categories
  ADD CONSTRAINT unique_slug_per_type_parent UNIQUE(slug, item_type, tenant_id, parent_id);

-- =====================================================
-- 5. DEACTIVATE OLD MARKETPLACE CATEGORIES
-- =====================================================

-- Mark old flat marketplace categories as inactive (we'll create new hierarchical ones)
UPDATE categories
SET is_active = false
WHERE item_type = 'marketplace_item'
  AND parent_id IS NULL;

-- =====================================================
-- 6. SEED HIERARCHICAL CATEGORIES FOR OBJECTS (macro_type = 'objects')
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_elettronica_id UUID;
  v_arredamento_id UUID;
  v_abbigliamento_id UUID;
  v_sport_id UUID;
  v_veicoli_id UUID;
  v_giardino_id UUID;
  v_altro_objects_id UUID;
BEGIN
  -- Get tenant_id for 'prato-rinaldo'
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'prato-rinaldo' LIMIT 1;

  -- If no tenant found, try to get any tenant
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  END IF;

  -- Raise error if no tenant exists
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- =====================================================
  -- MAIN CATEGORIES FOR OBJECTS
  -- =====================================================

  -- Elettronica
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Elettronica', 'elettronica-objects', 'marketplace_item', 'objects', 'Smartphone', 1, v_tenant_id, true)
  RETURNING id INTO v_elettronica_id;

  -- Arredamento
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Arredamento', 'arredamento', 'marketplace_item', 'objects', 'Sofa', 2, v_tenant_id, true)
  RETURNING id INTO v_arredamento_id;

  -- Abbigliamento
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Abbigliamento', 'abbigliamento-objects', 'marketplace_item', 'objects', 'Shirt', 3, v_tenant_id, true)
  RETURNING id INTO v_abbigliamento_id;

  -- Sport & Tempo Libero
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Sport & Tempo Libero', 'sport-tempo-libero', 'marketplace_item', 'objects', 'Dumbbell', 4, v_tenant_id, true)
  RETURNING id INTO v_sport_id;

  -- Veicoli
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Veicoli', 'veicoli', 'marketplace_item', 'objects', 'Car', 5, v_tenant_id, true)
  RETURNING id INTO v_veicoli_id;

  -- Giardino
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Giardino', 'giardino', 'marketplace_item', 'objects', 'Flower2', 6, v_tenant_id, true)
  RETURNING id INTO v_giardino_id;

  -- Altro (with custom input allowed)
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, custom_input_allowed)
  VALUES (gen_random_uuid(), 'Altro', 'altro-objects', 'marketplace_item', 'objects', 'MoreHorizontal', 99, v_tenant_id, true, true)
  RETURNING id INTO v_altro_objects_id;

  -- =====================================================
  -- SUBCATEGORIES FOR ELETTRONICA
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Smartphone', 'smartphone', 'marketplace_item', 'objects', 'Smartphone', 1, v_tenant_id, true, v_elettronica_id),
    ('Computer', 'computer', 'marketplace_item', 'objects', 'Laptop', 2, v_tenant_id, true, v_elettronica_id),
    ('TV/Audio', 'tv-audio', 'marketplace_item', 'objects', 'Tv', 3, v_tenant_id, true, v_elettronica_id),
    ('Elettrodomestici', 'elettrodomestici', 'marketplace_item', 'objects', 'Refrigerator', 4, v_tenant_id, true, v_elettronica_id),
    ('Fotocamere', 'fotocamere', 'marketplace_item', 'objects', 'Camera', 5, v_tenant_id, true, v_elettronica_id),
    ('Gaming', 'gaming', 'marketplace_item', 'objects', 'Gamepad2', 6, v_tenant_id, true, v_elettronica_id);

  -- =====================================================
  -- SUBCATEGORIES FOR ARREDAMENTO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Mobili', 'mobili-arred', 'marketplace_item', 'objects', 'Armchair', 1, v_tenant_id, true, v_arredamento_id),
    ('Illuminazione', 'illuminazione', 'marketplace_item', 'objects', 'Lamp', 2, v_tenant_id, true, v_arredamento_id),
    ('Decorazioni', 'decorazioni', 'marketplace_item', 'objects', 'Frame', 3, v_tenant_id, true, v_arredamento_id),
    ('Tessili', 'tessili', 'marketplace_item', 'objects', 'Bed', 4, v_tenant_id, true, v_arredamento_id);

  -- =====================================================
  -- SUBCATEGORIES FOR ABBIGLIAMENTO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Uomo', 'uomo', 'marketplace_item', 'objects', 'User', 1, v_tenant_id, true, v_abbigliamento_id),
    ('Donna', 'donna', 'marketplace_item', 'objects', 'User', 2, v_tenant_id, true, v_abbigliamento_id),
    ('Bambini', 'bambini', 'marketplace_item', 'objects', 'Baby', 3, v_tenant_id, true, v_abbigliamento_id),
    ('Scarpe', 'scarpe', 'marketplace_item', 'objects', 'Footprints', 4, v_tenant_id, true, v_abbigliamento_id),
    ('Accessori', 'accessori-abb', 'marketplace_item', 'objects', 'Watch', 5, v_tenant_id, true, v_abbigliamento_id);

  -- =====================================================
  -- SUBCATEGORIES FOR SPORT & TEMPO LIBERO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Attrezzi fitness', 'attrezzi-fitness', 'marketplace_item', 'objects', 'Dumbbell', 1, v_tenant_id, true, v_sport_id),
    ('Biciclette', 'biciclette', 'marketplace_item', 'objects', 'Bike', 2, v_tenant_id, true, v_sport_id),
    ('Sport acquatici', 'sport-acquatici', 'marketplace_item', 'objects', 'Waves', 3, v_tenant_id, true, v_sport_id),
    ('Outdoor', 'outdoor', 'marketplace_item', 'objects', 'Mountain', 4, v_tenant_id, true, v_sport_id),
    ('Sport di squadra', 'sport-squadra', 'marketplace_item', 'objects', 'Users', 5, v_tenant_id, true, v_sport_id);

  -- =====================================================
  -- SUBCATEGORIES FOR VEICOLI
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Auto', 'auto', 'marketplace_item', 'objects', 'Car', 1, v_tenant_id, true, v_veicoli_id),
    ('Moto/Scooter', 'moto-scooter', 'marketplace_item', 'objects', 'Bike', 2, v_tenant_id, true, v_veicoli_id),
    ('Bici elettriche', 'bici-elettriche', 'marketplace_item', 'objects', 'Zap', 3, v_tenant_id, true, v_veicoli_id),
    ('Ricambi', 'ricambi', 'marketplace_item', 'objects', 'Wrench', 4, v_tenant_id, true, v_veicoli_id),
    ('Altro', 'altro-veicoli', 'marketplace_item', 'objects', 'MoreHorizontal', 5, v_tenant_id, true, v_veicoli_id);

  -- =====================================================
  -- SUBCATEGORIES FOR GIARDINO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Attrezzi', 'attrezzi-giardino', 'marketplace_item', 'objects', 'Hammer', 1, v_tenant_id, true, v_giardino_id),
    ('Piante', 'piante', 'marketplace_item', 'objects', 'Flower', 2, v_tenant_id, true, v_giardino_id),
    ('Arredo esterno', 'arredo-esterno', 'marketplace_item', 'objects', 'Umbrella', 3, v_tenant_id, true, v_giardino_id),
    ('Irrigazione', 'irrigazione', 'marketplace_item', 'objects', 'Droplet', 4, v_tenant_id, true, v_giardino_id);

END $$;

-- =====================================================
-- 7. SEED HIERARCHICAL CATEGORIES FOR REAL ESTATE (macro_type = 'real_estate')
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_appartamento_id UUID;
  v_casa_id UUID;
  v_terreno_id UUID;
  v_commerciale_id UUID;
  v_box_id UUID;
BEGIN
  -- Get tenant_id for 'prato-rinaldo'
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'prato-rinaldo' LIMIT 1;

  -- If no tenant found, try to get any tenant
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  END IF;

  -- =====================================================
  -- MAIN CATEGORIES FOR REAL ESTATE
  -- =====================================================

  -- Appartamento
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Appartamento', 'appartamento', 'marketplace_item', 'real_estate', 'Building2', 1, v_tenant_id, true)
  RETURNING id INTO v_appartamento_id;

  -- Casa
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Casa', 'casa-re', 'marketplace_item', 'real_estate', 'Home', 2, v_tenant_id, true)
  RETURNING id INTO v_casa_id;

  -- Terreno
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Terreno', 'terreno', 'marketplace_item', 'real_estate', 'Mountain', 3, v_tenant_id, true)
  RETURNING id INTO v_terreno_id;

  -- Commerciale
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Commerciale', 'commerciale', 'marketplace_item', 'real_estate', 'Store', 4, v_tenant_id, true)
  RETURNING id INTO v_commerciale_id;

  -- Box/Garage
  INSERT INTO categories (id, name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active)
  VALUES (gen_random_uuid(), 'Box/Garage', 'box-garage', 'marketplace_item', 'real_estate', 'Warehouse', 5, v_tenant_id, true)
  RETURNING id INTO v_box_id;

  -- =====================================================
  -- SUBCATEGORIES FOR APPARTAMENTO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Monolocale', 'monolocale', 'marketplace_item', 'real_estate', 'Square', 1, v_tenant_id, true, v_appartamento_id),
    ('Bilocale', 'bilocale', 'marketplace_item', 'real_estate', 'LayoutGrid', 2, v_tenant_id, true, v_appartamento_id),
    ('Trilocale', 'trilocale', 'marketplace_item', 'real_estate', 'LayoutGrid', 3, v_tenant_id, true, v_appartamento_id),
    ('Quadrilocale+', 'quadrilocale', 'marketplace_item', 'real_estate', 'LayoutGrid', 4, v_tenant_id, true, v_appartamento_id),
    ('Attico', 'attico', 'marketplace_item', 'real_estate', 'ArrowUp', 5, v_tenant_id, true, v_appartamento_id),
    ('Loft', 'loft', 'marketplace_item', 'real_estate', 'Maximize', 6, v_tenant_id, true, v_appartamento_id);

  -- =====================================================
  -- SUBCATEGORIES FOR CASA
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Villa', 'villa', 'marketplace_item', 'real_estate', 'Castle', 1, v_tenant_id, true, v_casa_id),
    ('Villetta a schiera', 'villetta-schiera', 'marketplace_item', 'real_estate', 'Home', 2, v_tenant_id, true, v_casa_id),
    ('Casa indipendente', 'casa-indipendente', 'marketplace_item', 'real_estate', 'Home', 3, v_tenant_id, true, v_casa_id),
    ('Rustico', 'rustico', 'marketplace_item', 'real_estate', 'TreePine', 4, v_tenant_id, true, v_casa_id);

  -- =====================================================
  -- SUBCATEGORIES FOR TERRENO
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Agricolo', 'agricolo', 'marketplace_item', 'real_estate', 'Wheat', 1, v_tenant_id, true, v_terreno_id),
    ('Edificabile', 'edificabile', 'marketplace_item', 'real_estate', 'Building', 2, v_tenant_id, true, v_terreno_id),
    ('Boschivo', 'boschivo', 'marketplace_item', 'real_estate', 'TreePine', 3, v_tenant_id, true, v_terreno_id);

  -- =====================================================
  -- SUBCATEGORIES FOR COMMERCIALE
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Negozio', 'negozio', 'marketplace_item', 'real_estate', 'ShoppingBag', 1, v_tenant_id, true, v_commerciale_id),
    ('Ufficio', 'ufficio', 'marketplace_item', 'real_estate', 'Briefcase', 2, v_tenant_id, true, v_commerciale_id),
    ('Magazzino', 'magazzino', 'marketplace_item', 'real_estate', 'Package', 3, v_tenant_id, true, v_commerciale_id),
    ('Laboratorio', 'laboratorio', 'marketplace_item', 'real_estate', 'FlaskConical', 4, v_tenant_id, true, v_commerciale_id);

  -- =====================================================
  -- SUBCATEGORIES FOR BOX/GARAGE
  -- =====================================================

  INSERT INTO categories (name, slug, item_type, macro_type, icon, display_order, tenant_id, is_active, parent_id)
  VALUES
    ('Box singolo', 'box-singolo', 'marketplace_item', 'real_estate', 'Square', 1, v_tenant_id, true, v_box_id),
    ('Box doppio', 'box-doppio', 'marketplace_item', 'real_estate', 'Columns', 2, v_tenant_id, true, v_box_id),
    ('Posto auto', 'posto-auto', 'marketplace_item', 'real_estate', 'ParkingCircle', 3, v_tenant_id, true, v_box_id);

END $$;

-- =====================================================
-- 8. UPDATE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN categories.parent_id IS 'Reference to parent category for hierarchical subcategories';
COMMENT ON COLUMN categories.macro_type IS 'High-level category type: objects for physical items, real_estate for property listings';
COMMENT ON COLUMN categories.custom_input_allowed IS 'When true, allows users to enter custom text (e.g., for "Altro" categories)';

-- =====================================================
-- 9. CREATE HELPER FUNCTION TO GET CATEGORY TREE
-- =====================================================

CREATE OR REPLACE FUNCTION get_category_tree(p_item_type VARCHAR, p_macro_type VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  icon VARCHAR,
  parent_id UUID,
  macro_type VARCHAR,
  custom_input_allowed BOOLEAN,
  display_order INTEGER,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: root categories (no parent)
    SELECT
      c.id,
      c.name,
      c.slug,
      c.icon,
      c.parent_id,
      c.macro_type,
      c.custom_input_allowed,
      c.display_order,
      0 AS level
    FROM categories c
    WHERE c.parent_id IS NULL
      AND c.item_type = p_item_type
      AND c.is_active = true
      AND (p_macro_type IS NULL OR c.macro_type = p_macro_type)

    UNION ALL

    -- Recursive case: child categories
    SELECT
      c.id,
      c.name,
      c.slug,
      c.icon,
      c.parent_id,
      c.macro_type,
      c.custom_input_allowed,
      c.display_order,
      ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
  )
  SELECT * FROM category_tree
  ORDER BY level, display_order, name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_category_tree IS 'Returns hierarchical category tree for a given item_type and optional macro_type';

-- =====================================================
-- 10. CREATE HELPER FUNCTION TO GET SUBCATEGORIES
-- =====================================================

CREATE OR REPLACE FUNCTION get_subcategories(p_parent_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  icon VARCHAR,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.icon,
    c.display_order
  FROM categories c
  WHERE c.parent_id = p_parent_id
    AND c.is_active = true
  ORDER BY c.display_order, c.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_subcategories IS 'Returns all active subcategories for a given parent category';
