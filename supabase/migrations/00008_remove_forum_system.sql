-- =====================================================
-- REMOVE FORUM SYSTEM
-- =====================================================
-- This migration removes the old forum system that has been
-- replaced by the Agorà civic proposals system.

-- Drop forum tables (in reverse order of dependencies)
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS forum_threads CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;

-- Remove forum-related values from moderation_item_type enum
-- Note: PostgreSQL doesn't support removing enum values directly
-- We need to create a new enum and alter the column

-- Create new enum without forum types
CREATE TYPE moderation_item_type_new AS ENUM (
  'marketplace',
  'professional_profile',
  'proposal',
  'proposal_comment',
  'tutorial_request'
);

-- Update moderation_queue table to use new enum
ALTER TABLE moderation_queue
  ALTER COLUMN item_type TYPE moderation_item_type_new
  USING item_type::text::moderation_item_type_new;

-- Drop old enum
DROP TYPE moderation_item_type;

-- Rename new enum to original name
ALTER TYPE moderation_item_type_new RENAME TO moderation_item_type;
