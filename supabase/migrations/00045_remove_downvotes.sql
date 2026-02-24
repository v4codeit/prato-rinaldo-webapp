-- =====================================================
-- MIGRATION: Remove Downvotes System from Agora
-- =====================================================
-- This migration removes the downvote functionality from the
-- proposals system, converting it to an upvote-only model.
--
-- Changes:
-- 1. Remove 'downvotes' column from proposals
-- 2. Convert 'score' from generated column to regular column (= upvotes)
-- 3. Delete all existing downvotes from proposal_votes
-- 4. Update trigger to handle only upvotes
--
-- NOTE: The 'down' value remains in proposal_vote_type ENUM
-- because PostgreSQL does not support removing enum values easily.
-- The application code should prevent 'down' votes from being created.
-- =====================================================

-- =====================================================
-- STEP 1: Delete all existing downvotes
-- =====================================================
-- This must happen BEFORE modifying the trigger to avoid
-- incorrect vote count updates during deletion.

DELETE FROM proposal_votes WHERE vote_type = 'down';

-- =====================================================
-- STEP 2: Drop the trigger temporarily
-- =====================================================
-- We need to drop the trigger before modifying the table structure
-- and the function.

DROP TRIGGER IF EXISTS trigger_update_proposal_vote_counts ON proposal_votes;

-- =====================================================
-- STEP 3: Modify proposals table structure
-- =====================================================
-- We need to:
-- a) Drop the generated 'score' column (depends on downvotes)
-- b) Drop the 'downvotes' column
-- c) Add 'score' back as a regular column equal to upvotes

-- Drop the generated score column first (it depends on upvotes and downvotes)
ALTER TABLE proposals DROP COLUMN IF EXISTS score;

-- Drop the downvotes column
ALTER TABLE proposals DROP COLUMN IF EXISTS downvotes;

-- Add score back as a regular integer column (will be equal to upvotes)
ALTER TABLE proposals ADD COLUMN score INT DEFAULT 0 NOT NULL;

-- Update score to match upvotes for all existing proposals
UPDATE proposals SET score = upvotes;

-- Add a check constraint to ensure score is always non-negative
ALTER TABLE proposals ADD CONSTRAINT proposals_score_non_negative CHECK (score >= 0);

-- =====================================================
-- STEP 4: Create new trigger function (upvotes only)
-- =====================================================
-- The new function only handles upvotes. If a downvote somehow
-- gets inserted (shouldn't happen with proper app code), it's ignored.

CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only process upvotes
    IF NEW.vote_type = 'up' THEN
      UPDATE proposals
      SET upvotes = upvotes + 1,
          score = upvotes + 1  -- Keep score in sync
      WHERE id = NEW.proposal_id;
    END IF;
    -- Ignore downvotes silently (should not happen)

  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote type changes
    -- If changing FROM up to something else, decrement
    IF OLD.vote_type = 'up' AND NEW.vote_type != 'up' THEN
      UPDATE proposals
      SET upvotes = upvotes - 1,
          score = upvotes - 1
      WHERE id = NEW.proposal_id;
    -- If changing TO up from something else, increment
    ELSIF OLD.vote_type != 'up' AND NEW.vote_type = 'up' THEN
      UPDATE proposals
      SET upvotes = upvotes + 1,
          score = upvotes + 1
      WHERE id = NEW.proposal_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement for upvote deletions
    IF OLD.vote_type = 'up' THEN
      UPDATE proposals
      SET upvotes = GREATEST(0, upvotes - 1),
          score = GREATEST(0, upvotes - 1)
      WHERE id = OLD.proposal_id;
    END IF;
    -- Ignore downvote deletions (already cleaned up above)
  END IF;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the function purpose
COMMENT ON FUNCTION update_proposal_vote_counts() IS
  'Updates proposal upvotes and score counters. Downvotes are no longer supported (removed in migration 00045).';

-- =====================================================
-- STEP 5: Recreate the trigger
-- =====================================================

CREATE TRIGGER trigger_update_proposal_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_counts();

-- =====================================================
-- STEP 6: Add constraint to prevent new downvotes
-- =====================================================
-- This is a safety net at the database level to prevent
-- accidental insertion of downvotes.

ALTER TABLE proposal_votes
ADD CONSTRAINT proposal_votes_upvotes_only
CHECK (vote_type = 'up');

-- =====================================================
-- STEP 7: Update indexes (optional optimization)
-- =====================================================
-- The score index is still useful for ordering proposals.
-- No changes needed as the index definition remains valid.

-- Verify the index exists (it should from original migration)
-- CREATE INDEX IF NOT EXISTS idx_proposals_score ON proposals(tenant_id, score DESC);

-- =====================================================
-- DOCUMENTATION
-- =====================================================
-- After this migration:
-- - proposals.downvotes column: REMOVED
-- - proposals.score column: Regular INT (equals upvotes)
-- - proposal_votes with vote_type='down': DELETED
-- - proposal_vote_type ENUM: Still has 'down' value (unused)
-- - New downvotes: Prevented by CHECK constraint
--
-- Application code should:
-- - Remove all downvote UI elements
-- - Remove downvote logic from server actions
-- - Update validators to only accept 'up' vote type
-- =====================================================
