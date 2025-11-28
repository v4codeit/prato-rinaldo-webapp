-- =============================================================================
-- Migration: 00040_fix_push_notification_rls.sql
-- Description: Fix RLS issue for push notification Edge Function
--
-- Problem: Edge Function uses service_role key but topic_members RLS policies
--          use auth.uid() which returns NULL for service role connections.
--          This causes the query to return 0 rows even when members exist.
--
-- Solution: Create SECURITY DEFINER function that bypasses RLS
-- =============================================================================

-- Function to get topic members for push notification delivery
-- Uses SECURITY DEFINER to bypass RLS for Edge Functions
CREATE OR REPLACE FUNCTION get_topic_members_for_notification(
  p_topic_id UUID,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT tm.user_id
  FROM topic_members tm
  WHERE tm.topic_id = p_topic_id
    AND tm.is_muted = false
    AND (p_exclude_user_id IS NULL OR tm.user_id != p_exclude_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Documentation
COMMENT ON FUNCTION get_topic_members_for_notification IS
  'Returns topic members for push notification delivery. Uses SECURITY DEFINER to bypass RLS for Edge Functions. Called by send-push-notification Edge Function.';

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION get_topic_members_for_notification TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_members_for_notification TO service_role;
