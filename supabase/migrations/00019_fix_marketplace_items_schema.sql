-- Migration: Fix marketplace_items schema
-- Description: Add missing 'condition' and 'is_sold' columns to marketplace_items table
-- Date: 2025-01-31

-- =============================================================================
-- STEP 1: Create marketplace_condition ENUM type
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE marketplace_condition AS ENUM (
    'new',        -- Nuovo
    'like_new',   -- Come nuovo
    'good',       -- Buone condizioni
    'fair',       -- Discrete condizioni
    'poor'        -- Condizioni scarse
  );
EXCEPTION
  WHEN duplicate_object THEN
    -- Type already exists, skip creation
    NULL;
END $$;

-- =============================================================================
-- STEP 2: Add 'condition' column to marketplace_items
-- =============================================================================
ALTER TABLE marketplace_items
  ADD COLUMN IF NOT EXISTS condition marketplace_condition;

COMMENT ON COLUMN marketplace_items.condition IS
  'Condizione dell''articolo: new, like_new, good, fair, poor';

-- =============================================================================
-- STEP 3: Add 'is_sold' column to marketplace_items
-- =============================================================================
ALTER TABLE marketplace_items
  ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN marketplace_items.is_sold IS
  'Flag che indica se l''articolo è stato venduto. Impostato a true quando sold_at è valorizzato.';

-- =============================================================================
-- STEP 4: Create index for filtering sold items
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_marketplace_is_sold
  ON marketplace_items(tenant_id, status, is_sold)
  WHERE is_sold = false;

COMMENT ON INDEX idx_marketplace_is_sold IS
  'Index parziale per filtrare rapidamente gli articoli non venduti per tenant e status';

-- =============================================================================
-- STEP 5: Update existing rows to set is_sold based on sold_at
-- =============================================================================
UPDATE marketplace_items
SET is_sold = true
WHERE sold_at IS NOT NULL AND is_sold = false;

-- =============================================================================
-- STEP 6: Create trigger to auto-sync is_sold with sold_at
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_marketplace_is_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- When sold_at is set, automatically mark is_sold as true
  IF NEW.sold_at IS NOT NULL AND OLD.sold_at IS NULL THEN
    NEW.is_sold = true;
  END IF;

  -- When sold_at is cleared, mark is_sold as false
  IF NEW.sold_at IS NULL AND OLD.sold_at IS NOT NULL THEN
    NEW.is_sold = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_marketplace_is_sold
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_marketplace_is_sold();

COMMENT ON TRIGGER trigger_sync_marketplace_is_sold ON marketplace_items IS
  'Sincronizza automaticamente is_sold con sold_at quando uno dei due cambia';
