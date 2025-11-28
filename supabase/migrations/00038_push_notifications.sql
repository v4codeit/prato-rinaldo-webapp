-- =====================================================
-- PUSH NOTIFICATIONS SYSTEM
-- Migration: 00038_push_notifications.sql
-- =====================================================

-- =====================================================
-- PUSH_SUBSCRIPTIONS TABLE
-- Stores Web Push API subscriptions per user/device
-- =====================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,      -- Base64 encoded public key
  auth_key TEXT NOT NULL,         -- Base64 encoded auth secret

  -- Device info (for display in settings)
  device_name VARCHAR(100),       -- "Chrome su Windows", "Safari su iPhone"
  device_type VARCHAR(20),        -- 'desktop' | 'mobile' | 'tablet'
  browser_name VARCHAR(50),       -- 'Chrome' | 'Firefox' | 'Safari' | 'Edge'

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_used_at TIMESTAMPTZ,
  failed_count INT DEFAULT 0 NOT NULL,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each endpoint is unique per user (same browser on same device)
  CONSTRAINT unique_user_endpoint UNIQUE(user_id, endpoint)
);

-- Indexes for efficient queries
CREATE INDEX idx_push_subs_user_active ON push_subscriptions(user_id) WHERE is_active = true;
CREATE INDEX idx_push_subs_tenant ON push_subscriptions(tenant_id) WHERE is_active = true;
CREATE INDEX idx_push_subs_failed ON push_subscriptions(failed_count) WHERE failed_count >= 3;
CREATE INDEX idx_push_subs_cleanup ON push_subscriptions(updated_at) WHERE is_active = false;

-- =====================================================
-- USER_NOTIFICATION_PREFERENCES TABLE
-- User preferences for notification types and quiet hours
-- =====================================================

CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Global toggles
  push_enabled BOOLEAN DEFAULT true NOT NULL,
  email_enabled BOOLEAN DEFAULT true NOT NULL,

  -- Push notification types
  push_messages BOOLEAN DEFAULT true NOT NULL,        -- Topic messages (community chat)
  push_mentions BOOLEAN DEFAULT true NOT NULL,        -- @mentions
  push_events BOOLEAN DEFAULT true NOT NULL,          -- Event reminders
  push_proposals BOOLEAN DEFAULT true NOT NULL,       -- Agorà updates (proposals)
  push_marketplace BOOLEAN DEFAULT true NOT NULL,     -- Marketplace messages
  push_community_pro BOOLEAN DEFAULT true NOT NULL,   -- Professional profile updates
  push_announcements BOOLEAN DEFAULT true NOT NULL,   -- Admin announcements

  -- Quiet hours (optional - no notifications during this time)
  quiet_hours_enabled BOOLEAN DEFAULT false NOT NULL,
  quiet_hours_start TIME,                             -- e.g., '22:00'
  quiet_hours_end TIME,                               -- e.g., '08:00'

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_notification_prefs UNIQUE(user_id)
);

-- Index for quick user lookup
CREATE INDEX idx_notif_prefs_user ON user_notification_preferences(user_id);

-- =====================================================
-- PUSH_NOTIFICATION_LOGS TABLE
-- Audit trail for sent push notifications
-- =====================================================

CREATE TABLE push_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,

  -- Notification content
  notification_type VARCHAR(30) NOT NULL,  -- 'message' | 'mention' | 'event' | 'proposal' | 'marketplace' | 'announcement'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  url VARCHAR(500),
  tag VARCHAR(100),                        -- For grouping/replacing notifications

  -- Status
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,  -- 'pending' | 'sent' | 'failed' | 'expired'
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT check_push_log_status CHECK (status IN ('pending', 'sent', 'failed', 'expired'))
);

-- Indexes
CREATE INDEX idx_push_logs_user_time ON push_notification_logs(user_id, created_at DESC);
CREATE INDEX idx_push_logs_status ON push_notification_logs(status) WHERE status IN ('pending', 'failed');
-- Note: Cleanup is done by cron job, simple index on created_at for efficient deletion
CREATE INDEX idx_push_logs_created_at ON push_notification_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR push_subscriptions
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "push_subs_select_own" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own subscriptions
CREATE POLICY "push_subs_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    tenant_id = get_user_tenant_id()
  );

-- Users can update their own subscriptions
CREATE POLICY "push_subs_update_own" ON push_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own subscriptions
CREATE POLICY "push_subs_delete_own" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- Admins can manage all subscriptions (for debugging)
CREATE POLICY "push_subs_admin_all" ON push_subscriptions
  FOR ALL USING (is_admin());

-- =====================================================
-- RLS POLICIES FOR user_notification_preferences
-- =====================================================

-- Users can view their own preferences
CREATE POLICY "notif_prefs_select_own" ON user_notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "notif_prefs_insert_own" ON user_notification_preferences
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    tenant_id = get_user_tenant_id()
  );

-- Users can update their own preferences
CREATE POLICY "notif_prefs_update_own" ON user_notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all preferences (for debugging)
CREATE POLICY "notif_prefs_admin_select" ON user_notification_preferences
  FOR SELECT USING (is_admin());

-- =====================================================
-- RLS POLICIES FOR push_notification_logs
-- =====================================================

-- Users can view their own notification logs
CREATE POLICY "push_logs_select_own" ON push_notification_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view and manage all logs
CREATE POLICY "push_logs_admin_all" ON push_notification_logs
  FOR ALL USING (is_admin());

-- Service role can insert logs (via Edge Function)
-- Note: Edge Functions use service role key which bypasses RLS

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user should receive push notification for a specific type
CREATE OR REPLACE FUNCTION should_send_push(
  p_user_id UUID,
  p_notification_type VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_prefs user_notification_preferences%ROWTYPE;
  v_now TIME := LOCALTIME;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, default to enabled
  IF v_prefs IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check global push toggle
  IF NOT v_prefs.push_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled AND
     v_prefs.quiet_hours_start IS NOT NULL AND
     v_prefs.quiet_hours_end IS NOT NULL THEN

    IF v_prefs.quiet_hours_start > v_prefs.quiet_hours_end THEN
      -- Overnight quiet hours (e.g., 22:00 to 08:00)
      IF v_now >= v_prefs.quiet_hours_start OR v_now <= v_prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    ELSE
      -- Same day quiet hours (e.g., 12:00 to 14:00)
      IF v_now >= v_prefs.quiet_hours_start AND v_now <= v_prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;

  -- Check specific notification type preference
  RETURN CASE p_notification_type
    WHEN 'message' THEN v_prefs.push_messages
    WHEN 'mention' THEN v_prefs.push_mentions
    WHEN 'event' THEN v_prefs.push_events
    WHEN 'proposal' THEN v_prefs.push_proposals
    WHEN 'marketplace' THEN v_prefs.push_marketplace
    WHEN 'community_pro' THEN v_prefs.push_community_pro
    WHEN 'announcement' THEN v_prefs.push_announcements
    ELSE TRUE  -- Default to enabled for unknown types
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get active push subscriptions for a user
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.endpoint,
    ps.p256dh_key,
    ps.auth_key
  FROM push_subscriptions ps
  WHERE ps.user_id = p_user_id
    AND ps.is_active = true
    AND ps.failed_count < 3;  -- Skip subscriptions that failed too many times
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment failed count for a subscription (called by Edge Function)
CREATE OR REPLACE FUNCTION increment_push_failed_count(p_subscription_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE push_subscriptions
  SET
    failed_count = failed_count + 1,
    updated_at = NOW()
  WHERE id = p_subscription_id;

  -- Auto-deactivate if too many failures
  UPDATE push_subscriptions
  SET is_active = false
  WHERE id = p_subscription_id AND failed_count >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark subscription as used (update last_used_at)
CREATE OR REPLACE FUNCTION mark_push_subscription_used(p_subscription_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE push_subscriptions
  SET
    last_used_at = NOW(),
    failed_count = 0,  -- Reset failed count on success
    updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on push_subscriptions
CREATE TRIGGER trigger_push_subs_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_topics_updated_at();

-- Auto-update updated_at on user_notification_preferences
CREATE TRIGGER trigger_notif_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_topics_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions per utente e dispositivo. Contiene le chiavi necessarie per inviare notifiche push.';
COMMENT ON TABLE user_notification_preferences IS 'Preferenze utente per le notifiche push: toggle per tipo e ore di silenzio.';
COMMENT ON TABLE push_notification_logs IS 'Log di audit per le notifiche push inviate. Utile per debugging e analytics.';

COMMENT ON FUNCTION should_send_push IS 'Verifica se un utente deve ricevere una push notification di un certo tipo, considerando le preferenze e le ore di silenzio.';
COMMENT ON FUNCTION get_user_push_subscriptions IS 'Restituisce le subscriptions attive per un utente (usata dalla Edge Function).';
COMMENT ON FUNCTION increment_push_failed_count IS 'Incrementa il contatore di fallimenti per una subscription e la disattiva se supera il limite.';
COMMENT ON FUNCTION mark_push_subscription_used IS 'Aggiorna last_used_at e resetta il contatore fallimenti (usata dopo invio riuscito).';
