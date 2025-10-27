-- =====================================================
-- ADD IS_PRIVATE FLAG TO MARKETPLACE ITEMS
-- =====================================================
-- This migration adds the is_private field to marketplace_items
-- to allow private listings visible only to registered users.

ALTER TABLE marketplace_items
ADD COLUMN is_private BOOLEAN DEFAULT false NOT NULL;

-- Create index for efficient filtering
CREATE INDEX idx_marketplace_is_private ON marketplace_items(tenant_id, is_private, status);

COMMENT ON COLUMN marketplace_items.is_private IS
'If true, item is only visible to registered users. If false, visible to all visitors.';
