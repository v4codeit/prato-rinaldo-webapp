-- =====================================================
-- TOPICS SYSTEM - Telegram-style Chat Topics
-- Migration: 00030_topics_system.sql
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Topic visibility (who can SEE the topic)
CREATE TYPE topic_visibility AS ENUM (
  'public',        -- Everyone (including non-authenticated)
  'authenticated', -- Logged-in users only
  'verified',      -- Verified residents only
  'members_only'   -- Only manually added members
);

-- Topic write permission (who can WRITE to the topic)
CREATE TYPE topic_write_permission AS ENUM (
  'all_viewers',   -- Everyone who can see can write
  'verified',      -- Only verified residents
  'members_only',  -- Only members with writer+ role
  'admins_only'    -- Only admin/board
);

-- Topic member role
CREATE TYPE topic_member_role AS ENUM (
  'viewer',        -- Read only
  'writer',        -- Read + write
  'moderator',     -- + message management
  'admin'          -- + topic management
);

-- Topic message type
CREATE TYPE topic_message_type AS ENUM (
  'text',          -- User text message
  'system',        -- System notification (join, leave)
  'auto_post',     -- Auto-generated (new event, etc.)
  'image'          -- Image with caption
);

-- =====================================================
-- TOPICS TABLE
-- =====================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),  -- Emoji or icon name
  color VARCHAR(20) DEFAULT '#0891b2',
  cover_image TEXT,

  -- Permissions
  visibility topic_visibility DEFAULT 'verified' NOT NULL,
  write_permission topic_write_permission DEFAULT 'verified' NOT NULL,

  -- Auto-post config (nullable = manual topic)
  auto_post_source VARCHAR(50),  -- 'events' | 'marketplace' | 'proposals' | null
  auto_post_filter JSONB DEFAULT '{}',

  -- Settings
  is_default BOOLEAN DEFAULT false NOT NULL,  -- Default topic (Bacheca Annunci)
  is_archived BOOLEAN DEFAULT false NOT NULL,
  order_index INT DEFAULT 0 NOT NULL,

  -- Denormalized stats
  message_count INT DEFAULT 0 NOT NULL,
  member_count INT DEFAULT 0 NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_author_name VARCHAR(100),

  -- Meta
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_topic_slug UNIQUE(tenant_id, slug)
);

-- Indexes for topics
CREATE INDEX idx_topics_tenant_active ON topics(tenant_id, is_archived, order_index);
CREATE INDEX idx_topics_visibility ON topics(tenant_id, visibility) WHERE is_archived = false;
CREATE INDEX idx_topics_auto_post ON topics(auto_post_source) WHERE auto_post_source IS NOT NULL;

-- =====================================================
-- TOPIC_MEMBERS TABLE (Subscriptions & unread tracking)
-- =====================================================

CREATE TABLE topic_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role and permissions
  role topic_member_role DEFAULT 'writer' NOT NULL,

  -- Notifications
  is_muted BOOLEAN DEFAULT false NOT NULL,

  -- Read tracking
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_message_id UUID,
  unread_count INT DEFAULT 0 NOT NULL CHECK (unread_count >= 0),

  -- Meta
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  added_by UUID REFERENCES users(id),

  CONSTRAINT unique_topic_member UNIQUE(topic_id, user_id)
);

-- Indexes for topic_members
CREATE INDEX idx_members_user ON topic_members(user_id, last_read_at DESC);
CREATE INDEX idx_members_unread ON topic_members(user_id) WHERE unread_count > 0;
CREATE INDEX idx_members_topic ON topic_members(topic_id, role);

-- =====================================================
-- TOPIC_MESSAGES TABLE
-- =====================================================

CREATE TABLE topic_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

  -- Author (nullable for system messages)
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Content
  content TEXT NOT NULL CHECK (char_length(content) <= 4000),
  message_type topic_message_type DEFAULT 'text' NOT NULL,

  -- Rich content metadata
  metadata JSONB DEFAULT '{}',
  -- Structures:
  -- image: {"url": "...", "width": 800, "height": 600}
  -- auto_post: {"source_type": "events", "source_id": "xxx", "title": "..."}
  -- mentions: ["user_id_1", "user_id_2"]

  -- Replies
  reply_to_id UUID REFERENCES topic_messages(id) ON DELETE SET NULL,

  -- Reactions (denormalized for performance)
  reactions JSONB DEFAULT '{}',
  -- Structure: {"thumb_up": ["user_id_1", "user_id_2"], "heart": ["user_id_3"]}

  -- Edit/delete
  is_edited BOOLEAN DEFAULT false NOT NULL,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  deleted_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for topic_messages
CREATE INDEX idx_messages_topic_time ON topic_messages(topic_id, created_at DESC);
CREATE INDEX idx_messages_author ON topic_messages(author_id, created_at DESC) WHERE author_id IS NOT NULL;
CREATE INDEX idx_messages_replies ON topic_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_not_deleted ON topic_messages(topic_id, created_at DESC) WHERE is_deleted = false;

-- =====================================================
-- TOPIC_MESSAGE_REACTIONS TABLE (detailed tracking)
-- =====================================================

CREATE TABLE topic_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES topic_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_reaction UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON topic_message_reactions(message_id);
CREATE INDEX idx_reactions_user ON topic_message_reactions(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_message_reactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR TOPICS
-- =====================================================

-- Check if user is a member of a topic with specific role
CREATE OR REPLACE FUNCTION is_topic_member(p_topic_id UUID, p_min_role topic_member_role DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
  v_role topic_member_role;
BEGIN
  SELECT role INTO v_role
  FROM topic_members
  WHERE topic_id = p_topic_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Role hierarchy: viewer < writer < moderator < admin
  RETURN CASE p_min_role
    WHEN 'viewer' THEN TRUE
    WHEN 'writer' THEN v_role IN ('writer', 'moderator', 'admin')
    WHEN 'moderator' THEN v_role IN ('moderator', 'admin')
    WHEN 'admin' THEN v_role = 'admin'
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can view a topic
CREATE OR REPLACE FUNCTION can_view_topic(p_topic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_topic topics%ROWTYPE;
BEGIN
  SELECT * INTO v_topic FROM topics WHERE id = p_topic_id;

  IF v_topic IS NULL OR v_topic.is_archived THEN
    RETURN FALSE;
  END IF;

  -- Admin override
  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check visibility
  RETURN CASE v_topic.visibility
    WHEN 'public' THEN TRUE
    WHEN 'authenticated' THEN auth.uid() IS NOT NULL
    WHEN 'verified' THEN is_verified()
    WHEN 'members_only' THEN is_topic_member(p_topic_id, 'viewer')
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can write to a topic
CREATE OR REPLACE FUNCTION can_write_topic(p_topic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_topic topics%ROWTYPE;
BEGIN
  -- Must be able to view first
  IF NOT can_view_topic(p_topic_id) THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_topic FROM topics WHERE id = p_topic_id;

  -- Admin override
  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check write permission
  RETURN CASE v_topic.write_permission
    WHEN 'all_viewers' THEN TRUE
    WHEN 'verified' THEN is_verified()
    WHEN 'members_only' THEN is_topic_member(p_topic_id, 'writer')
    WHEN 'admins_only' THEN is_topic_member(p_topic_id, 'admin') OR is_admin()
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS POLICIES FOR TOPICS
-- =====================================================

-- SELECT: Visibility based on topic settings
CREATE POLICY "topics_select" ON topics FOR SELECT USING (
  tenant_id = get_user_tenant_id() AND
  is_archived = false AND
  (
    visibility = 'public' OR
    (visibility = 'authenticated' AND auth.uid() IS NOT NULL) OR
    (visibility = 'verified' AND is_verified()) OR
    (visibility = 'members_only' AND is_topic_member(id, 'viewer')) OR
    is_admin()
  )
);

-- SELECT archived topics for admins only
CREATE POLICY "topics_select_archived_admin" ON topics FOR SELECT USING (
  is_admin() AND
  tenant_id = get_user_tenant_id() AND
  is_archived = true
);

-- INSERT: Only admins can create topics
CREATE POLICY "topics_insert_admin" ON topics FOR INSERT WITH CHECK (
  is_admin() AND
  tenant_id = get_user_tenant_id() AND
  created_by = auth.uid()
);

-- UPDATE: Only admins can update topics
CREATE POLICY "topics_update_admin" ON topics FOR UPDATE USING (
  is_admin() AND
  tenant_id = get_user_tenant_id()
);

-- DELETE: Only super admins can delete topics (soft delete via is_archived preferred)
CREATE POLICY "topics_delete_super_admin" ON topics FOR DELETE USING (
  is_super_admin() AND
  tenant_id = get_user_tenant_id()
);

-- =====================================================
-- RLS POLICIES FOR TOPIC_MEMBERS
-- =====================================================

-- SELECT: Users can see their own memberships
CREATE POLICY "members_select_own" ON topic_members FOR SELECT USING (
  user_id = auth.uid()
);

-- SELECT: Topic members can see other members of topics they belong to
CREATE POLICY "members_select_topic" ON topic_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM topic_members tm
    WHERE tm.topic_id = topic_members.topic_id
    AND tm.user_id = auth.uid()
  )
);

-- SELECT: Admins can see all members
CREATE POLICY "members_select_admin" ON topic_members FOR SELECT USING (
  is_admin()
);

-- INSERT: Users can join topics they can view (for public/verified topics)
CREATE POLICY "members_insert_self" ON topic_members FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  can_view_topic(topic_id)
);

-- INSERT: Admins can add members to any topic in their tenant
CREATE POLICY "members_insert_admin" ON topic_members FOR INSERT WITH CHECK (
  is_admin() AND
  EXISTS (SELECT 1 FROM topics WHERE id = topic_id AND tenant_id = get_user_tenant_id())
);

-- UPDATE: Users can update their own membership (mute, etc.)
CREATE POLICY "members_update_own" ON topic_members FOR UPDATE USING (
  user_id = auth.uid()
);

-- UPDATE: Topic admins can update member roles
CREATE POLICY "members_update_topic_admin" ON topic_members FOR UPDATE USING (
  is_topic_member(topic_id, 'admin') OR is_admin()
);

-- DELETE: Users can leave topics
CREATE POLICY "members_delete_own" ON topic_members FOR DELETE USING (
  user_id = auth.uid()
);

-- DELETE: Topic admins can remove members
CREATE POLICY "members_delete_topic_admin" ON topic_members FOR DELETE USING (
  is_topic_member(topic_id, 'admin') OR is_admin()
);

-- =====================================================
-- RLS POLICIES FOR TOPIC_MESSAGES
-- =====================================================

-- SELECT: Can view messages if can view topic
CREATE POLICY "messages_select" ON topic_messages FOR SELECT USING (
  can_view_topic(topic_id) AND
  is_deleted = false
);

-- SELECT: Admins can see deleted messages
CREATE POLICY "messages_select_deleted_admin" ON topic_messages FOR SELECT USING (
  is_admin() AND is_deleted = true
);

-- INSERT: Can post if can write to topic
CREATE POLICY "messages_insert" ON topic_messages FOR INSERT WITH CHECK (
  (author_id = auth.uid() OR author_id IS NULL) AND
  can_write_topic(topic_id)
);

-- UPDATE: Authors can edit their own messages (within reasonable time)
CREATE POLICY "messages_update_own" ON topic_messages FOR UPDATE USING (
  author_id = auth.uid() AND
  is_deleted = false
);

-- UPDATE: Moderators can update messages (for moderation)
CREATE POLICY "messages_update_moderator" ON topic_messages FOR UPDATE USING (
  is_topic_member(topic_id, 'moderator') OR is_admin()
);

-- DELETE: Soft delete only - use UPDATE to set is_deleted
-- No DELETE policy needed, we use soft delete

-- =====================================================
-- RLS POLICIES FOR TOPIC_MESSAGE_REACTIONS
-- =====================================================

-- SELECT: Can see reactions if can view topic
CREATE POLICY "reactions_select" ON topic_message_reactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM topic_messages tm
    WHERE tm.id = message_id AND can_view_topic(tm.topic_id)
  )
);

-- INSERT: Can add reaction if can view topic
CREATE POLICY "reactions_insert" ON topic_message_reactions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM topic_messages tm
    WHERE tm.id = message_id AND can_view_topic(tm.topic_id)
  )
);

-- DELETE: Users can remove their own reactions
CREATE POLICY "reactions_delete_own" ON topic_message_reactions FOR DELETE USING (
  user_id = auth.uid()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update topic stats on new message
CREATE OR REPLACE FUNCTION update_topic_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    -- Update topic stats
    UPDATE topics SET
      message_count = message_count + 1,
      last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      last_message_author_name = (
        SELECT COALESCE(name, email) FROM users WHERE id = NEW.author_id
      ),
      updated_at = NOW()
    WHERE id = NEW.topic_id;

    -- Increment unread for all members except author
    UPDATE topic_members SET
      unread_count = unread_count + 1
    WHERE topic_id = NEW.topic_id
      AND user_id != COALESCE(NEW.author_id, '00000000-0000-0000-0000-000000000000')
      AND is_muted = false;
  END IF;

  -- Handle soft delete
  IF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE topics SET
      message_count = GREATEST(0, message_count - 1),
      updated_at = NOW()
    WHERE id = NEW.topic_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_topic_message_insert
AFTER INSERT OR UPDATE ON topic_messages
FOR EACH ROW EXECUTE FUNCTION update_topic_on_message();

-- Sync reactions JSONB on topic_message_reactions changes
CREATE OR REPLACE FUNCTION sync_message_reactions()
RETURNS TRIGGER AS $$
DECLARE
  v_message_id UUID;
BEGIN
  v_message_id := COALESCE(NEW.message_id, OLD.message_id);

  UPDATE topic_messages SET
    reactions = (
      SELECT COALESCE(
        jsonb_object_agg(emoji, user_ids),
        '{}'::jsonb
      )
      FROM (
        SELECT emoji, array_agg(user_id::text) as user_ids
        FROM topic_message_reactions
        WHERE message_id = v_message_id
        GROUP BY emoji
      ) sub
    ),
    updated_at = NOW()
  WHERE id = v_message_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_reactions
AFTER INSERT OR DELETE ON topic_message_reactions
FOR EACH ROW EXECUTE FUNCTION sync_message_reactions();

-- Update member count on join/leave
CREATE OR REPLACE FUNCTION update_topic_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE topics SET
      member_count = member_count + 1,
      updated_at = NOW()
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE topics SET
      member_count = GREATEST(0, member_count - 1),
      updated_at = NOW()
    WHERE id = OLD.topic_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_topic_member_count
AFTER INSERT OR DELETE ON topic_members
FOR EACH ROW EXECUTE FUNCTION update_topic_member_count();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_topics_updated_at();

CREATE TRIGGER trigger_topic_messages_updated_at
BEFORE UPDATE ON topic_messages
FOR EACH ROW EXECUTE FUNCTION update_topics_updated_at();

-- =====================================================
-- SUPABASE REALTIME CONFIGURATION
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE topic_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE topic_members;
ALTER PUBLICATION supabase_realtime ADD TABLE topics;

-- =====================================================
-- SEED DEFAULT TOPIC
-- =====================================================

-- Bacheca Annunci (default topic) - will be created after migration runs
-- This is done via a separate seed script or application code
-- because we need to reference the tenant and super_admin user

COMMENT ON TABLE topics IS 'Telegram-style chat topics for community discussions';
COMMENT ON TABLE topic_members IS 'Topic membership with role-based permissions and unread tracking';
COMMENT ON TABLE topic_messages IS 'Messages within topics with reactions and reply support';
COMMENT ON TABLE topic_message_reactions IS 'Emoji reactions on messages';
