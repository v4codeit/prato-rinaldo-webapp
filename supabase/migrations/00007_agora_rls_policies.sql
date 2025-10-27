-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR AGORÀ
-- =====================================================

-- Enable RLS on all Agorà tables
ALTER TABLE proposal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROPOSAL CATEGORIES POLICIES
-- =====================================================

-- Everyone can view categories
CREATE POLICY "proposal_categories_select_all"
ON proposal_categories FOR SELECT
USING (true);

-- Only admins can insert categories
CREATE POLICY "proposal_categories_insert_admin"
ON proposal_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- Only admins can update categories
CREATE POLICY "proposal_categories_update_admin"
ON proposal_categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- Only admins can delete categories
CREATE POLICY "proposal_categories_delete_admin"
ON proposal_categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- PROPOSALS POLICIES
-- =====================================================

-- Everyone can view proposals
CREATE POLICY "proposals_select_all"
ON proposals FOR SELECT
USING (true);

-- Only verified residents can create proposals
CREATE POLICY "proposals_insert_verified"
ON proposals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.verification_status = 'approved'
  )
);

-- Authors can update their own proposals (only if status is 'proposed')
CREATE POLICY "proposals_update_author"
ON proposals FOR UPDATE
USING (
  author_id = auth.uid()
  AND status = 'proposed'
);

-- Admins and board members can update any proposal
CREATE POLICY "proposals_update_admin_board"
ON proposals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.admin_role IN ('admin', 'super_admin', 'moderator')
      OR users.is_in_board = true
    )
  )
);

-- Authors can delete their own proposals (only if status is 'proposed' and no votes)
CREATE POLICY "proposals_delete_author"
ON proposals FOR DELETE
USING (
  author_id = auth.uid()
  AND status = 'proposed'
  AND upvotes = 0
  AND downvotes = 0
);

-- =====================================================
-- PROPOSAL VOTES POLICIES
-- =====================================================

-- Users can see all votes
CREATE POLICY "proposal_votes_select_all"
ON proposal_votes FOR SELECT
USING (true);

-- Only verified residents can vote
CREATE POLICY "proposal_votes_insert_verified"
ON proposal_votes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.verification_status = 'approved'
  )
);

-- Users can update their own votes
CREATE POLICY "proposal_votes_update_own"
ON proposal_votes FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "proposal_votes_delete_own"
ON proposal_votes FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PROPOSAL COMMENTS POLICIES
-- =====================================================

-- Everyone can view comments
CREATE POLICY "proposal_comments_select_all"
ON proposal_comments FOR SELECT
USING (true);

-- All registered users can comment
CREATE POLICY "proposal_comments_insert_authenticated"
ON proposal_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "proposal_comments_update_own"
ON proposal_comments FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "proposal_comments_delete_own"
ON proposal_comments FOR DELETE
USING (user_id = auth.uid());

-- Admins and moderators can delete any comment
CREATE POLICY "proposal_comments_delete_admin"
ON proposal_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin', 'moderator')
  )
);

-- =====================================================
-- PROPOSAL STATUS HISTORY POLICIES
-- =====================================================

-- Everyone can view status history
CREATE POLICY "proposal_status_history_select_all"
ON proposal_status_history FOR SELECT
USING (true);

-- Only the trigger can insert (no manual inserts)
-- This is handled by the trigger, no policy needed for INSERT
