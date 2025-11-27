-- =====================================================
-- FIX: Infinite recursion in topic_members RLS policy
-- Error: 42P17 "infinite recursion detected in policy for relation topic_members"
--
-- Problem: The policy "members_select_topic" queries topic_members
-- inside a policy on topic_members, causing infinite recursion.
--
-- Solution: Use a SECURITY DEFINER function that bypasses RLS.
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions
-- =====================================================

-- 1. Create SECURITY DEFINER function that bypasses RLS
-- This function checks if the current user is a member of a specific topic
CREATE OR REPLACE FUNCTION is_member_of_topic(p_topic_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM topic_members
    WHERE topic_id = p_topic_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "members_select_topic" ON topic_members;

-- 3. Recreate the policy using the SECURITY DEFINER function
-- This allows topic members to see other members of topics they belong to
CREATE POLICY "members_select_topic" ON topic_members FOR SELECT USING (
  is_member_of_topic(topic_id)
);

-- Add documentation
COMMENT ON FUNCTION is_member_of_topic(UUID) IS
'Security definer function to check topic membership without triggering RLS recursion.
Used in topic_members SELECT policy to allow members to view other members of the same topic.
Bypasses RLS to prevent infinite recursion (error 42P17).';
