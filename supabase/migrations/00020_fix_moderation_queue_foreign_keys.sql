-- =====================================================
-- Fix Missing Foreign Key Constraint on moderation_queue
-- =====================================================
--
-- PROBLEM: PostgREST error PGRST200
-- "Could not find a relationship between 'moderation_queue' and 'users'
--  using the hint 'item_creator_id'"
--
-- CAUSE: item_creator_id column exists but has NO foreign key constraint
--
-- SOLUTION: Add the missing foreign key constraint
-- =====================================================

-- Add foreign key constraint for item_creator_id
ALTER TABLE moderation_queue
ADD CONSTRAINT fk_moderation_queue_item_creator
FOREIGN KEY (item_creator_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Create index for better query performance (FK lookups)
CREATE INDEX IF NOT EXISTS idx_moderation_queue_item_creator_fk
ON moderation_queue(item_creator_id)
WHERE item_creator_id IS NOT NULL;

-- Verify the constraint was added
COMMENT ON CONSTRAINT fk_moderation_queue_item_creator ON moderation_queue IS
'Foreign key to users table - enables PostgREST relationship queries (submitter:users!item_creator_id)';
