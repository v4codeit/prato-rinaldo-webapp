-- =====================================================
-- PUSH NOTIFICATION WEBHOOK FOR USER NOTIFICATIONS
-- Migration: 20251203_push_webhook_trigger.sql
-- =====================================================

-- Function to send webhook for new user notifications
CREATE OR REPLACE FUNCTION notify_push_new_user_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_service_role_key TEXT;
  v_headers JSONB;
  v_payload JSONB;
BEGIN
  -- Only trigger on INSERT
  IF TG_OP = 'INSERT' THEN

    -- Get Edge Function URL from environment
    -- Format: https://<project-ref>.supabase.co/functions/v1/send-push-notification
    -- Fallback to a placeholder if setting is missing (prevents error, but won't send)
    BEGIN
      v_webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
      v_service_role_key := current_setting('app.settings.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      v_webhook_url := NULL;
    END;

    -- If settings are missing, we can't send
    IF v_webhook_url IS NULL OR v_service_role_key IS NULL THEN
      -- Try to construct from standard Supabase env vars if available in this context (unlikely in pure Postgres)
      -- So we just return
      RETURN NEW;
    END IF;

    -- Build headers
    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    );

    -- Build payload
    v_payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'user_notifications',
      'record', row_to_json(NEW)
    );

    -- Send webhook via pg_net (async HTTP request)
    -- Note: pg_net must be enabled
    BEGIN
      PERFORM net.http_post(
        url := v_webhook_url,
        headers := v_headers,
        body := v_payload::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING '[Push Notification] Failed to send webhook: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_push_new_user_notification ON user_notifications;

CREATE TRIGGER trigger_push_new_user_notification
  AFTER INSERT ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_new_user_notification();

-- Enable the trigger
-- Note: This assumes pg_net is enabled and app.settings are set. 
-- If not, the function handles errors gracefully.
