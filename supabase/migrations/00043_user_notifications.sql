-- ============================================================================
-- Migration: 00043_user_notifications.sql
-- Description: In-App Notification System for admin alerts and user notifications
-- Author: Claude Code
-- Date: November 2025
-- ============================================================================

-- ============================================================================
-- ENUM: notification_type
-- Defines the category of notification for filtering, icons, and routing
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'user_registration',      -- Nuovo utente registrato (richiede azione admin)
    'user_approved',          -- Utente approvato (info)
    'user_rejected',          -- Utente rifiutato (info)
    'proposal_new',           -- Nuova proposta Agorà
    'proposal_status',        -- Cambio stato proposta
    'event_reminder',         -- Reminder evento
    'marketplace_new',        -- Nuovo annuncio marketplace
    'announcement',           -- Annuncio admin
    'system'                  -- Notifica di sistema
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ENUM: notification_status
-- Defines the current state of a notification
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'unread',                 -- Non letta
    'read',                   -- Letta
    'action_pending',         -- Richiede azione (non completata)
    'action_completed',       -- Azione completata
    'archived'                -- Archiviata
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLE: user_notifications
-- Core notification storage table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,

  -- Related entity (polymorphic reference)
  related_type VARCHAR(50),           -- 'user', 'proposal', 'event', etc.
  related_id UUID,                    -- ID of related entity

  -- Navigation
  action_url VARCHAR(500),            -- Where to navigate on click

  -- Metadata (flexible JSON for type-specific data)
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  status notification_status DEFAULT 'unread' NOT NULL,
  requires_action BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ,
  action_completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Primary query: unread notifications per user (most common)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON user_notifications(user_id, created_at DESC)
  WHERE status IN ('unread', 'action_pending');

-- All notifications per user (notification center)
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON user_notifications(user_id, created_at DESC);

-- Type-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON user_notifications(type, created_at DESC);

-- Tenant-based queries (for admin views)
CREATE INDEX IF NOT EXISTS idx_notifications_tenant
  ON user_notifications(tenant_id, created_at DESC);

-- Related entity lookup (for marking actions completed)
CREATE INDEX IF NOT EXISTS idx_notifications_related
  ON user_notifications(related_type, related_id)
  WHERE related_id IS NOT NULL;

-- Action pending notifications (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_notifications_action_pending
  ON user_notifications(user_id, created_at DESC)
  WHERE status = 'action_pending';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications"
  ON user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications (for triggers and edge functions)
-- This is handled automatically by SECURITY DEFINER functions

-- Admins can view all notifications in their tenant
CREATE POLICY "Admins can view tenant notifications"
  ON user_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = user_notifications.tenant_id
      AND (users.role IN ('admin', 'super_admin') OR users.admin_role = 'moderator')
    )
  );

-- ============================================================================
-- FUNCTION: get_unread_notification_count
-- Returns count of unread and action_pending notifications for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_notifications
  WHERE user_id = p_user_id
  AND status IN ('unread', 'action_pending');
$$;

-- ============================================================================
-- FUNCTION: mark_notification_read
-- Marks a single notification as read (preserves action_pending if requires_action)
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_notifications
  SET
    status = CASE
      WHEN requires_action AND status = 'action_pending' THEN 'action_pending'::notification_status
      WHEN status = 'unread' THEN 'read'::notification_status
      ELSE status
    END,
    read_at = COALESCE(read_at, NOW())
  WHERE id = p_notification_id
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- FUNCTION: mark_notification_action_completed
-- Marks a notification (or related notifications) as action completed
-- ============================================================================
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
BEGIN
  UPDATE user_notifications
  SET
    status = 'action_completed'::notification_status,
    action_completed_at = NOW(),
    read_at = COALESCE(read_at, NOW())
  WHERE (
    (p_notification_id IS NOT NULL AND id = p_notification_id)
    OR (p_related_id IS NOT NULL AND related_id = p_related_id AND requires_action = true)
  )
  AND user_id = auth.uid()
  AND requires_action = true
  AND status != 'action_completed';

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- ============================================================================
-- FUNCTION: get_admin_notification_recipients
-- Returns all users who should receive admin notifications (admins, moderators, board)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_notification_recipients(p_tenant_id UUID)
RETURNS TABLE (user_id UUID, user_name TEXT, user_email TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.name,
    u.email
  FROM users u
  WHERE u.tenant_id = p_tenant_id
  AND u.verification_status = 'approved'
  AND (
    -- Admins and super admins
    u.role IN ('admin', 'super_admin')
    -- Moderators
    OR u.admin_role = 'moderator'
    -- Board members
    OR u.is_in_board = true
    -- Council members
    OR u.is_in_council = true
  );
$$;

-- ============================================================================
-- FUNCTION: notify_admins_new_user
-- Triggered after INSERT on users to notify admins of new registrations
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_admins_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify for new users with 'pending' verification status
  IF NEW.verification_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Build notification content
  notification_title := 'Nuovo utente registrato';
  notification_message := format(
    '%s (%s) si è registrato e richiede verifica.',
    COALESCE(NEW.name, 'Utente'),
    COALESCE(NEW.email, 'email non disponibile')
  );

  -- Insert notification for each admin/board member
  FOR admin_record IN
    SELECT * FROM get_admin_notification_recipients(NEW.tenant_id)
  LOOP
    INSERT INTO user_notifications (
      tenant_id,
      user_id,
      type,
      title,
      message,
      related_type,
      related_id,
      action_url,
      status,
      requires_action,
      metadata
    ) VALUES (
      NEW.tenant_id,
      admin_record.user_id,
      'user_registration'::notification_type,
      notification_title,
      notification_message,
      'user',
      NEW.id,
      '/admin/users?highlight=' || NEW.id::TEXT,
      'action_pending'::notification_status,
      true,
      jsonb_build_object(
        'new_user_id', NEW.id,
        'new_user_name', NEW.name,
        'new_user_email', NEW.email,
        'registered_at', NEW.created_at
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: on_new_user_notify_admins
-- Fires AFTER INSERT on users table to create admin notifications
-- ============================================================================
DROP TRIGGER IF EXISTS on_new_user_notify_admins ON users;

CREATE TRIGGER on_new_user_notify_admins
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_user();

-- ============================================================================
-- ENABLE REALTIME
-- Allow real-time subscriptions for notification updates
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;

-- ============================================================================
-- GRANTS
-- Ensure proper access for authenticated users
-- ============================================================================
GRANT SELECT, UPDATE ON user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_action_completed(UUID, UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- Documentation for the schema
-- ============================================================================
COMMENT ON TABLE user_notifications IS 'In-app notification system for admin alerts and user notifications';
COMMENT ON COLUMN user_notifications.type IS 'Notification category for filtering and display';
COMMENT ON COLUMN user_notifications.related_type IS 'Polymorphic reference type (user, proposal, event, etc.)';
COMMENT ON COLUMN user_notifications.related_id IS 'ID of the related entity';
COMMENT ON COLUMN user_notifications.action_url IS 'Navigation target when notification is clicked';
COMMENT ON COLUMN user_notifications.metadata IS 'Type-specific data in JSON format';
COMMENT ON COLUMN user_notifications.requires_action IS 'Whether notification requires user action to complete';
COMMENT ON FUNCTION notify_admins_new_user() IS 'Trigger function to notify admins when new user registers';
