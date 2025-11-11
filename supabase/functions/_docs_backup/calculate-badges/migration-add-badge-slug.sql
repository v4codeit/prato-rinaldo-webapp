-- Migration: Add slug and category columns to badges table
-- This enables easier badge identification in the calculate-badges function

-- Step 1: Add slug column (unique per tenant)
ALTER TABLE badges
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Step 2: Add category column for badge organization
ALTER TABLE badges
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';

-- Step 3: Create unique index on tenant_id + slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_badges_tenant_slug
ON badges(tenant_id, slug)
WHERE slug IS NOT NULL;

-- Step 4: Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_badges_category
ON badges(category);

-- Step 5: Update existing badges to have slugs (if any exist)
-- This is a one-time operation for existing data
UPDATE badges
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Step 6: Make slug NOT NULL after populating existing records
-- Uncomment this after verifying all badges have slugs:
-- ALTER TABLE badges ALTER COLUMN slug SET NOT NULL;

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'badges'
  AND column_name IN ('slug', 'category')
ORDER BY ordinal_position;
