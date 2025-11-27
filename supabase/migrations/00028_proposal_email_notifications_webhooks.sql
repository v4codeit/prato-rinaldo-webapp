-- =====================================================
-- PROPOSAL EMAIL NOTIFICATIONS WEBHOOKS
-- Setup webhooks for proposal comment and status notifications
-- =====================================================

-- Drop existing webhooks if they exist
DROP TRIGGER IF EXISTS proposal_comments_webhook ON proposal_comments;
DROP TRIGGER IF EXISTS proposals_status_webhook ON proposals;
DROP FUNCTION IF EXISTS notify_proposal_comment();
DROP FUNCTION IF EXISTS notify_proposal_status_change();

-- =====================================================
-- Function: Notify on new proposal comment
-- =====================================================
CREATE OR REPLACE FUNCTION notify_proposal_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Get Edge Function URL from environment or use default
  webhook_url := current_setting('app.webhook_url', true);
  IF webhook_url IS NULL THEN
    webhook_url := current_setting('SUPABASE_URL', true) || '/functions/v1/email-notifications';
  END IF;

  -- Send webhook payload asynchronously
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('SUPABASE_SERVICE_ROLE_KEY', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'proposal_comments',
      'record', jsonb_build_object(
        'id', NEW.id,
        'proposal_id', NEW.proposal_id,
        'user_id', NEW.user_id,
        'content', NEW.content,
        'created_at', NEW.created_at
      )
    )
  );

  RETURN NEW;
END;
$$;

-- =====================================================
-- Function: Notify on proposal status change
-- =====================================================
CREATE OR REPLACE FUNCTION notify_proposal_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get Edge Function URL from environment or use default
    webhook_url := current_setting('app.webhook_url', true);
    IF webhook_url IS NULL THEN
      webhook_url := current_setting('SUPABASE_URL', true) || '/functions/v1/email-notifications';
    END IF;

    -- Send webhook payload asynchronously
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('SUPABASE_SERVICE_ROLE_KEY', true)
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'proposals',
        'record', jsonb_build_object(
          'id', NEW.id,
          'title', NEW.title,
          'status', NEW.status,
          'decline_reason', NEW.decline_reason,
          'planned_date', NEW.planned_date,
          'completed_date', NEW.completed_date,
          'updated_at', NEW.updated_at
        ),
        'old_record', jsonb_build_object(
          'status', OLD.status
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- Triggers: Attach functions to tables
-- =====================================================

-- Trigger on new proposal comment
CREATE TRIGGER proposal_comments_webhook
AFTER INSERT ON proposal_comments
FOR EACH ROW
EXECUTE FUNCTION notify_proposal_comment();

-- Trigger on proposal status update
CREATE TRIGGER proposals_status_webhook
AFTER UPDATE ON proposals
FOR EACH ROW
EXECUTE FUNCTION notify_proposal_status_change();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION notify_proposal_comment() IS 'Sends webhook notification when a new comment is added to a proposal';
COMMENT ON FUNCTION notify_proposal_status_change() IS 'Sends webhook notification when proposal status changes';
COMMENT ON TRIGGER proposal_comments_webhook ON proposal_comments IS 'Triggers email notification to proposal author on new comment';
COMMENT ON TRIGGER proposals_status_webhook ON proposals IS 'Triggers email notification to voters on status change';
