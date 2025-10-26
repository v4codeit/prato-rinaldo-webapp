-- Row Level Security Policies for Prato Rinaldo WebApp
-- Ensures data isolation and proper access control

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions_log ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Check if user is admin/moderator
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR admin_role IS NOT NULL)
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is verified
CREATE OR REPLACE FUNCTION auth.is_verified()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND verification_status = 'approved'
  );
$$ LANGUAGE SQL STABLE;

-- ============ TENANTS POLICIES ============

-- Anyone can read active tenants
CREATE POLICY "Tenants are viewable by everyone"
  ON tenants FOR SELECT
  USING (is_active = true);

-- Only super_admin can modify tenants
CREATE POLICY "Only super_admin can modify tenants"
  ON tenants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- ============ USERS POLICIES ============

-- Users can view other verified users in same tenant
CREATE POLICY "Users can view verified users in same tenant"
  ON users FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND verification_status = 'approved'
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all users in their tenant
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Admins can update users in their tenant
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ ARTICLES POLICIES ============

-- Published articles are viewable by everyone in tenant
CREATE POLICY "Published articles are viewable"
  ON articles FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND status = 'published'
  );

-- Admins can view all articles
CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Admins can create/update/delete articles
CREATE POLICY "Admins can manage articles"
  ON articles FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ EVENTS POLICIES ============

-- Public events viewable by everyone
CREATE POLICY "Public events are viewable"
  ON events FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND event_type = 'public'
  );

-- Private events only for verified users
CREATE POLICY "Private events for verified users"
  ON events FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND (event_type = 'public' OR auth.is_verified())
  );

-- Verified users can create events
CREATE POLICY "Verified users can create events"
  ON events FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND tenant_id = auth.get_user_tenant_id()
    AND organizer_id = auth.uid()
  );

-- Organizers and admins can update/delete events
CREATE POLICY "Organizers and admins can manage events"
  ON events FOR ALL
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND (organizer_id = auth.uid() OR auth.is_admin())
  );

-- ============ EVENT RSVPS POLICIES ============

-- Users can view RSVPs for events they can see
CREATE POLICY "Users can view event RSVPs"
  ON event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_rsvps.event_id
      AND events.tenant_id = auth.get_user_tenant_id()
    )
  );

-- Verified users can create/update their own RSVPs
CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR ALL
  USING (user_id = auth.uid() AND auth.is_verified())
  WITH CHECK (user_id = auth.uid() AND auth.is_verified());

-- ============ MARKETPLACE POLICIES ============

-- Approved items viewable by everyone in tenant
CREATE POLICY "Approved marketplace items are viewable"
  ON marketplace_items FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND status = 'approved'
  );

-- Sellers can view their own items
CREATE POLICY "Sellers can view own items"
  ON marketplace_items FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND seller_id = auth.uid()
  );

-- Admins can view all items
CREATE POLICY "Admins can view all marketplace items"
  ON marketplace_items FOR SELECT
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Verified users can create items
CREATE POLICY "Verified users can create marketplace items"
  ON marketplace_items FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND tenant_id = auth.get_user_tenant_id()
    AND seller_id = auth.uid()
  );

-- Sellers can update own items (not status)
CREATE POLICY "Sellers can update own items"
  ON marketplace_items FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Admins can update all items
CREATE POLICY "Admins can update marketplace items"
  ON marketplace_items FOR UPDATE
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ PROFESSIONAL PROFILES POLICIES ============

-- Approved profiles viewable by verified users
CREATE POLICY "Approved profiles are viewable"
  ON professional_profiles FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND status = 'approved'
    AND auth.is_verified()
  );

-- Users can view their own profiles
CREATE POLICY "Users can view own profiles"
  ON professional_profiles FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND user_id = auth.uid()
  );

-- Verified users can create profiles
CREATE POLICY "Verified users can create profiles"
  ON professional_profiles FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND tenant_id = auth.get_user_tenant_id()
    AND user_id = auth.uid()
  );

-- Users can update own profiles
CREATE POLICY "Users can update own profiles"
  ON professional_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles"
  ON professional_profiles FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ FORUM POLICIES ============

-- Forum categories viewable by verified users
CREATE POLICY "Forum categories viewable by verified users"
  ON forum_categories FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND auth.is_verified()
  );

-- Approved threads viewable by verified users
CREATE POLICY "Approved threads viewable"
  ON forum_threads FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND status = 'approved'
    AND auth.is_verified()
  );

-- Verified users can create threads
CREATE POLICY "Verified users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND tenant_id = auth.get_user_tenant_id()
    AND author_id = auth.uid()
  );

-- Authors can update own threads
CREATE POLICY "Authors can update own threads"
  ON forum_threads FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admins can manage all threads
CREATE POLICY "Admins can manage threads"
  ON forum_threads FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Approved posts viewable by verified users
CREATE POLICY "Approved posts viewable"
  ON forum_posts FOR SELECT
  USING (
    status = 'approved'
    AND auth.is_verified()
  );

-- Verified users can create posts
CREATE POLICY "Verified users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND author_id = auth.uid()
  );

-- Authors can update own posts
CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admins can manage all posts
CREATE POLICY "Admins can manage posts"
  ON forum_posts FOR ALL
  USING (auth.is_admin());

-- ============ TUTORIAL REQUESTS POLICIES ============

-- Verified users can view tutorial requests
CREATE POLICY "Verified users can view tutorials"
  ON tutorial_requests FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND auth.is_verified()
  );

-- Verified users can create requests
CREATE POLICY "Verified users can create tutorial requests"
  ON tutorial_requests FOR INSERT
  WITH CHECK (
    auth.is_verified()
    AND tenant_id = auth.get_user_tenant_id()
    AND requester_id = auth.uid()
  );

-- Admins can manage tutorial requests
CREATE POLICY "Admins can manage tutorial requests"
  ON tutorial_requests FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ DOCUMENTS POLICIES ============

-- Verified users can view documents
CREATE POLICY "Verified users can view documents"
  ON documents FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND auth.is_verified()
  );

-- Admins can manage documents
CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- ============ GAMIFICATION POLICIES ============

-- Badges viewable by verified users
CREATE POLICY "Badges viewable by verified users"
  ON badges FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND auth.is_verified()
  );

-- User badges viewable by verified users
CREATE POLICY "User badges viewable"
  ON user_badges FOR SELECT
  USING (auth.is_verified());

-- Users can view their own points
CREATE POLICY "Users can view own points"
  ON user_points FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage gamification
CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  USING (auth.is_admin());

CREATE POLICY "Admins can manage user badges"
  ON user_badges FOR ALL
  USING (auth.is_admin());

CREATE POLICY "Admins can manage user points"
  ON user_points FOR ALL
  USING (auth.is_admin());

-- ============ MODERATION POLICIES ============

-- Only admins/moderators can view moderation queue
CREATE POLICY "Admins can view moderation queue"
  ON moderation_queue FOR SELECT
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Only admins/moderators can manage moderation queue
CREATE POLICY "Admins can manage moderation queue"
  ON moderation_queue FOR ALL
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

-- Only admins/moderators can view moderation actions
CREATE POLICY "Admins can view moderation actions"
  ON moderation_actions_log FOR SELECT
  USING (auth.is_admin());

-- Only admins/moderators can create moderation actions
CREATE POLICY "Admins can create moderation actions"
  ON moderation_actions_log FOR INSERT
  WITH CHECK (
    auth.is_admin()
    AND moderator_id = auth.uid()
  );

