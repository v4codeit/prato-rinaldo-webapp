-- =====================================================
-- FIX REACTIONS UPDATE POLICY AND TRIGGER
-- =====================================================
-- Problem: When user changes emoji (e.g., ❤️ to 😂), the server returns
-- {"action":"changed"} but the database is NOT updated.
--
-- Root Cause:
-- 1. Missing RLS UPDATE policy - Supabase silently returns success with 0 rows modified
-- 2. Trigger sync_message_reactions only fires on INSERT/DELETE, not UPDATE
--
-- Solution:
-- 1. Add UPDATE policy for topic_message_reactions
-- 2. Recreate trigger to fire on INSERT OR UPDATE OR DELETE
-- =====================================================

-- 1. Add UPDATE policy (users can only update their own reactions)
CREATE POLICY "reactions_update_own" ON topic_message_reactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Drop and recreate trigger to include UPDATE events
DROP TRIGGER IF EXISTS trigger_sync_reactions ON topic_message_reactions;

CREATE TRIGGER trigger_sync_reactions
AFTER INSERT OR UPDATE OR DELETE ON topic_message_reactions
FOR EACH ROW EXECUTE FUNCTION sync_message_reactions();

-- 3. Add comment for documentation
COMMENT ON POLICY "reactions_update_own" ON topic_message_reactions IS
'Users can only update their own reactions. Required for emoji change functionality.';
