-- =============================================================================
-- Migration: 00041_topic_visibility_system.sql
-- Description: Extends topic visibility system with new visibility levels,
--              hidden topics support, granular non-member access, and
--              auto-membership for existing users.
--
-- Changes:
--   1. Add new visibility enum values: board_only, admins_only
--   2. Add is_hidden column for completely hidden topics
--   3. Add non_member_access column for granular access control
--   4. Update RLS policies for new visibility levels
--   5. Auto-add existing verified users to applicable topics
-- =============================================================================

-- =============================================================================
-- 1. EXTEND ENUM: Add new visibility values
-- =============================================================================

-- Add new values to topic_visibility enum
-- Note: ALTER TYPE ... ADD VALUE cannot run inside transaction
-- These statements are idempotent (IF NOT EXISTS)
ALTER TYPE topic_visibility ADD VALUE IF NOT EXISTS 'board_only';
ALTER TYPE topic_visibility ADD VALUE IF NOT EXISTS 'admins_only';

-- =============================================================================
-- 2. ADD NEW COLUMNS
-- =============================================================================

-- Add is_hidden column: when true, topic is only visible to explicit members
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add non_member_access column: controls what non-members can do
-- 'full' = read + write (per write_permission)
-- 'read_only' = can read messages but not write
-- 'preview_only' = can only see topic name/description, cannot enter
ALTER TABLE topics ADD COLUMN IF NOT EXISTS non_member_access TEXT DEFAULT 'full';

-- Add check constraint for non_member_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_non_member_access_check'
  ) THEN
    ALTER TABLE topics ADD CONSTRAINT topics_non_member_access_check
      CHECK (non_member_access IN ('full', 'read_only', 'preview_only'));
  END IF;
END $$;

-- =============================================================================
-- 3. UPDATE RLS POLICY FOR TOPICS
-- =============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view topics based on visibility" ON topics;

-- Create updated policy with new visibility levels and is_hidden support
-- Note: Using visibility::text cast to avoid "unsafe use of new enum value" error
-- This is required because ALTER TYPE ADD VALUE cannot be used in the same transaction
CREATE POLICY "Users can view topics based on visibility" ON topics
FOR SELECT USING (
  -- Super admin/admin can see all topics (including hidden)
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  OR
  -- Members can always see their topics (including members_only and hidden)
  EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = topics.id AND tm.user_id = auth.uid()
  )
  OR
  -- Non-hidden, non-members_only topics follow visibility rules
  (
    COALESCE(is_hidden, false) = false
    AND visibility::text NOT IN ('members_only')
    AND (
      -- Public: everyone can see
      visibility::text = 'public'
      -- Authenticated: any logged-in user
      OR (visibility::text = 'authenticated' AND auth.uid() IS NOT NULL)
      -- Verified: only approved users
      OR (visibility::text = 'verified' AND (
        SELECT verification_status FROM users WHERE id = auth.uid()
      ) = 'approved')
      -- Board only: users with committee_role set
      OR (visibility::text = 'board_only' AND (
        SELECT committee_role FROM users WHERE id = auth.uid()
      ) IS NOT NULL)
      -- Admins only: admin or super_admin role
      OR (visibility::text = 'admins_only' AND (
        SELECT role FROM users WHERE id = auth.uid()
      ) IN ('admin', 'super_admin'))
    )
  )
);

-- =============================================================================
-- 4. AUTO-ADD EXISTING USERS TO APPLICABLE TOPICS
-- =============================================================================

-- 4a. Add ALL verified users to default/authenticated/verified/public topics
-- This ensures they can receive push notifications
-- Note: Using visibility::text cast to avoid "unsafe use of new enum value" error
INSERT INTO topic_members (topic_id, user_id, role, unread_count, last_read_at)
SELECT DISTINCT
  t.id as topic_id,
  u.id as user_id,
  'writer'::topic_member_role as role,
  0 as unread_count,
  NOW() as last_read_at
FROM topics t
CROSS JOIN users u
WHERE u.verification_status = 'approved'
  AND u.tenant_id = t.tenant_id
  AND t.is_archived = false
  AND COALESCE(t.is_hidden, false) = false
  AND t.visibility::text NOT IN ('members_only', 'board_only', 'admins_only')
  AND NOT EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = t.id AND tm.user_id = u.id
  );

-- 4b. Add admins to admins_only topics (with admin role in topic)
INSERT INTO topic_members (topic_id, user_id, role, unread_count, last_read_at)
SELECT DISTINCT
  t.id as topic_id,
  u.id as user_id,
  'admin'::topic_member_role as role,
  0 as unread_count,
  NOW() as last_read_at
FROM topics t
CROSS JOIN users u
WHERE u.role IN ('admin', 'super_admin')
  AND u.tenant_id = t.tenant_id
  AND t.is_archived = false
  AND t.visibility::text = 'admins_only'
  AND NOT EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = t.id AND tm.user_id = u.id
  );

-- 4c. Add board members (committee_role IS NOT NULL) to board_only topics
INSERT INTO topic_members (topic_id, user_id, role, unread_count, last_read_at)
SELECT DISTINCT
  t.id as topic_id,
  u.id as user_id,
  'writer'::topic_member_role as role,
  0 as unread_count,
  NOW() as last_read_at
FROM topics t
CROSS JOIN users u
WHERE u.committee_role IS NOT NULL
  AND u.tenant_id = t.tenant_id
  AND t.is_archived = false
  AND t.visibility::text = 'board_only'
  AND NOT EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = t.id AND tm.user_id = u.id
  );

-- =============================================================================
-- 5. ALSO ADD ADMINS TO ALL EXISTING TOPICS (as admins)
-- This ensures admins are members of all topics for notifications
-- =============================================================================

INSERT INTO topic_members (topic_id, user_id, role, unread_count, last_read_at)
SELECT DISTINCT
  t.id as topic_id,
  u.id as user_id,
  'admin'::topic_member_role as role,
  0 as unread_count,
  NOW() as last_read_at
FROM topics t
CROSS JOIN users u
WHERE u.role IN ('admin', 'super_admin')
  AND u.tenant_id = t.tenant_id
  AND t.is_archived = false
  AND NOT EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = t.id AND tm.user_id = u.id
  );

-- =============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN topics.is_hidden IS
  'If true, topic is only visible to explicit members. For non-members it does not exist in any list.';

COMMENT ON COLUMN topics.non_member_access IS
  'Access level for non-members who can see the topic: full (read+write per write_permission), read_only (read messages only), preview_only (see name/description only, cannot enter)';

-- Update visibility enum comment (must be done outside transaction for enum changes)
-- Note: This may fail on some Postgres versions but is non-critical
DO $$
BEGIN
  COMMENT ON TYPE topic_visibility IS
    'Topic visibility levels: public (all), authenticated (logged in), verified (approved residents), board_only (committee members), admins_only (admins), members_only (explicit members like WhatsApp group)';
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors for enum comments
    NULL;
END $$;

-- =============================================================================
-- 7. LOG MIGRATION RESULT
-- =============================================================================

DO $$
DECLARE
  verified_added INT;
  admin_added INT;
  board_added INT;
BEGIN
  -- Count how many memberships were added
  SELECT COUNT(*) INTO verified_added
  FROM topic_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE u.verification_status = 'approved'
    AND tm.last_read_at > NOW() - INTERVAL '5 seconds';

  RAISE NOTICE '[Migration 00041] Verified users added to topics: approximately % new memberships', verified_added;
END $$;
