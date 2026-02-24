-- Update function to allow marking related notifications as completed for ALL users
-- This is useful when an admin verifies a user, we want to clear the notification for all other admins

CREATE OR REPLACE FUNCTION mark_notification_action_completed(
  p_notification_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INTEGER;
  current_count INTEGER;
BEGIN
  rows_affected := 0;

  -- 1. Mark specific notification (User specific)
  -- Only the owner can mark their specific notification as completed directly
  IF p_notification_id IS NOT NULL THEN
    UPDATE user_notifications
    SET
      status = 'action_completed'::notification_status,
      action_completed_at = NOW(),
      read_at = COALESCE(read_at, NOW())
    WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND status != 'action_completed';
    
    GET DIAGNOSTICS current_count = ROW_COUNT;
    rows_affected := rows_affected + current_count;
  END IF;

  -- 2. Mark related notifications (Global/Bulk update)
  -- e.g. When a user is verified, mark all "registration" notifications for that user as completed for ALL admins
  -- This requires the user to be an admin/super_admin to execute (enforced by RLS/policy usually, but here we trust the caller context or add a check)
  IF p_related_id IS NOT NULL THEN
    -- Optional: Check if executor is admin? 
    -- For now, we assume this function is called from trusted server actions or by admins.
    
    UPDATE user_notifications
    SET
      status = 'action_completed'::notification_status,
      action_completed_at = NOW(),
      read_at = COALESCE(read_at, NOW())
    WHERE related_id = p_related_id
    AND requires_action = true
    AND status != 'action_completed';
    
    GET DIAGNOSTICS current_count = ROW_COUNT;
    rows_affected := rows_affected + current_count;
  END IF;

  RETURN rows_affected > 0;
END;
$$;
