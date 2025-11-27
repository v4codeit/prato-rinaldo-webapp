-- =====================================================
-- PUSH NOTIFICATION WEBHOOK TRIGGER
-- Migration: 00039_push_notification_webhook.sql
-- =====================================================

-- Note: This trigger calls the send-push-notification Edge Function
-- via Supabase's pg_net extension for HTTP requests.
-- The webhook URL must be configured in Supabase Dashboard > Database > Webhooks
-- or via the net.http_post function.

-- =====================================================
-- WEBHOOK FUNCTION FOR TOPIC MESSAGES
-- =====================================================

-- Function to send webhook for new topic messages
CREATE OR REPLACE FUNCTION notify_push_new_topic_message()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_service_role_key TEXT;
  v_headers JSONB;
  v_payload JSONB;
BEGIN
  -- Only trigger on INSERT of text messages with an author
  IF TG_OP = 'INSERT' AND
     NEW.message_type = 'text' AND
     NEW.author_id IS NOT NULL AND
     NEW.is_deleted = false THEN

    -- Get Edge Function URL from environment
    -- Format: https://<project-ref>.supabase.co/functions/v1/send-push-notification
    v_webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';

    -- Get service role key for authentication
    v_service_role_key := current_setting('app.settings.service_role_key', true);

    -- Build headers
    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    );

    -- Build payload
    v_payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'topic_messages',
      'record', jsonb_build_object(
        'id', NEW.id,
        'topic_id', NEW.topic_id,
        'author_id', NEW.author_id,
        'content', NEW.content,
        'message_type', NEW.message_type,
        'created_at', NEW.created_at
      )
    );

    -- Send webhook via pg_net (async HTTP request)
    -- Note: pg_net must be enabled in Supabase Dashboard > Database > Extensions
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

-- =====================================================
-- CREATE TRIGGER (Initially disabled)
-- =====================================================

-- Create trigger for topic_messages
-- Note: This trigger is created but DISABLED by default
-- Enable it after:
-- 1. Deploying the send-push-notification Edge Function
-- 2. Configuring app.settings.supabase_url and app.settings.service_role_key

DROP TRIGGER IF EXISTS trigger_push_new_topic_message ON topic_messages;

CREATE TRIGGER trigger_push_new_topic_message
  AFTER INSERT ON topic_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_new_topic_message();

-- Disable by default (enable after Edge Function deployment)
ALTER TABLE topic_messages DISABLE TRIGGER trigger_push_new_topic_message;

-- =====================================================
-- ALTERNATIVE: Database Webhook (Recommended)
-- =====================================================
-- Instead of using pg_net directly, you can configure a
-- Database Webhook in Supabase Dashboard:
--
-- 1. Go to Database > Webhooks
-- 2. Create new webhook:
--    - Name: push-notification-topic-messages
--    - Table: topic_messages
--    - Events: INSERT
--    - Type: Supabase Edge Function
--    - Function: send-push-notification
--    - HTTP Headers: (none needed, uses service role)
--
-- This approach is simpler and doesn't require pg_net.

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================

COMMENT ON FUNCTION notify_push_new_topic_message IS '
Push Notification Webhook Trigger

SETUP:
1. Deploy Edge Function:
   pnpm exec supabase functions deploy send-push-notification

2. Set secrets:
   pnpm exec supabase secrets set VAPID_PUBLIC_KEY="..."
   pnpm exec supabase secrets set VAPID_PRIVATE_KEY="..."
   pnpm exec supabase secrets set VAPID_SUBJECT="mailto:noreply@pratorinaldo.it"
   pnpm exec supabase secrets set APP_URL="https://pratorinaldo.it"

3. Enable pg_net extension (if using this trigger):
   - Supabase Dashboard > Database > Extensions > pg_net

4. Set app settings (if using this trigger):
   ALTER DATABASE postgres SET app.settings.supabase_url = ''https://xxx.supabase.co'';
   ALTER DATABASE postgres SET app.settings.service_role_key = ''your-service-role-key'';

5. Enable trigger:
   ALTER TABLE topic_messages ENABLE TRIGGER trigger_push_new_topic_message;

ALTERNATIVE (Recommended):
Use Supabase Dashboard > Database > Webhooks to create a webhook
that calls the Edge Function on topic_messages INSERT events.
';

-- =====================================================
-- CLEANUP OLD DATA FUNCTION (for cron job)
-- =====================================================

-- Function to clean up old push notification logs
CREATE OR REPLACE FUNCTION cleanup_old_push_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM push_notification_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Also clean up inactive subscriptions older than 90 days
  DELETE FROM push_subscriptions
  WHERE is_active = false
    AND updated_at < NOW() - INTERVAL '90 days';

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_push_logs IS 'Cleanup function for push notification logs. Add to cron job to run daily.';
