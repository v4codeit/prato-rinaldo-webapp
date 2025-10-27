-- Email Notifications Webhook Setup
-- This script creates database triggers that call the email-notifications Edge Function
-- when moderation status changes occur

-- Prerequisites:
-- 1. Deploy the email-notifications Edge Function first
-- 2. Set WEBHOOK_SECRET in your Supabase secrets
-- 3. Replace 'your-project' with your actual Supabase project reference

-- ============================================
-- MARKETPLACE ITEMS STATUS CHANGE WEBHOOK
-- ============================================

-- Function to send webhook on marketplace_items status change
CREATE OR REPLACE FUNCTION notify_marketplace_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://your-project.supabase.co/functions/v1/email-notifications';
  webhook_secret TEXT := current_setting('app.settings.webhook_secret', true);
  request_id INT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Send webhook using pg_net extension
    SELECT net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-signature', webhook_secret
      )
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for marketplace_items
DROP TRIGGER IF EXISTS marketplace_status_change_trigger ON marketplace_items;
CREATE TRIGGER marketplace_status_change_trigger
  AFTER UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_status_change();

-- ============================================
-- PROFESSIONAL PROFILES STATUS CHANGE WEBHOOK
-- ============================================

-- Function to send webhook on professional_profiles status change
CREATE OR REPLACE FUNCTION notify_professional_status_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://your-project.supabase.co/functions/v1/email-notifications';
  webhook_secret TEXT := current_setting('app.settings.webhook_secret', true);
  request_id INT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Send webhook using pg_net extension
    SELECT net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-signature', webhook_secret
      )
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for professional_profiles
DROP TRIGGER IF EXISTS professional_status_change_trigger ON professional_profiles;
CREATE TRIGGER professional_status_change_trigger
  AFTER UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_professional_status_change();

-- ============================================
-- USER VERIFICATION STATUS CHANGE WEBHOOK
-- ============================================

-- Function to send webhook on user verification status change
CREATE OR REPLACE FUNCTION notify_user_verification_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://your-project.supabase.co/functions/v1/email-notifications';
  webhook_secret TEXT := current_setting('app.settings.webhook_secret', true);
  request_id INT;
BEGIN
  -- Only trigger on verification_status change
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    -- Send webhook using pg_net extension
    SELECT net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-signature', webhook_secret
      )
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users
DROP TRIGGER IF EXISTS user_verification_change_trigger ON users;
CREATE TRIGGER user_verification_change_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_verification_change();

-- ============================================
-- CONFIGURATION
-- ============================================

-- Set webhook secret (replace with your actual secret)
-- This should match the WEBHOOK_SECRET environment variable in your Edge Function
-- ALTER DATABASE postgres SET app.settings.webhook_secret TO 'your-webhook-secret-here';

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify triggers are created
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_name IN (
  'marketplace_status_change_trigger',
  'professional_status_change_trigger',
  'user_verification_change_trigger'
)
ORDER BY event_object_table;

-- ============================================
-- TESTING
-- ============================================

-- Test marketplace_items webhook (update this with a real item ID)
-- UPDATE marketplace_items SET status = 'approved' WHERE id = 'test-item-id';

-- Test professional_profiles webhook (update this with a real profile ID)
-- UPDATE professional_profiles SET status = 'approved' WHERE id = 'test-profile-id';

-- Test users verification webhook (update this with a real user ID)
-- UPDATE users SET verification_status = 'approved' WHERE id = 'test-user-id';

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To remove all triggers and functions:
-- DROP TRIGGER IF EXISTS marketplace_status_change_trigger ON marketplace_items;
-- DROP TRIGGER IF EXISTS professional_status_change_trigger ON professional_profiles;
-- DROP TRIGGER IF EXISTS user_verification_change_trigger ON users;
-- DROP FUNCTION IF EXISTS notify_marketplace_status_change();
-- DROP FUNCTION IF EXISTS notify_professional_status_change();
-- DROP FUNCTION IF EXISTS notify_user_verification_change();
