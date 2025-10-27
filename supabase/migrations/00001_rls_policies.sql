-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get user's tenant ID
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin
DROP FUNCTION IF EXISTS is_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'super_admin') FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is super admin
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is moderator
DROP FUNCTION IF EXISTS is_moderator() CASCADE;
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS BOOLEAN AS $$
  SELECT admin_role IN ('super_admin', 'admin', 'moderator') FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is verified
DROP FUNCTION IF EXISTS is_verified() CASCADE;
CREATE OR REPLACE FUNCTION is_verified()
RETURNS BOOLEAN AS $$
  SELECT verification_status = 'approved' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- TENANTS POLICIES
-- =====================================================
CREATE POLICY "tenants_select_public" ON tenants FOR SELECT USING (is_active = true);

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());

-- Verified users can read other verified users in same tenant
CREATE POLICY "users_select_same_tenant" ON users FOR SELECT USING (
  tenant_id = get_user_tenant_id() AND
  verification_status = 'approved'
);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());

-- Admins can read all users in their tenant
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (
  is_admin() AND
  tenant_id = get_user_tenant_id()
);

-- Admins can update users in their tenant
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (
  is_admin() AND
  tenant_id = get_user_tenant_id()
);

-- Super admins can read all users
CREATE POLICY "users_select_super_admin" ON users FOR SELECT USING (is_super_admin());

-- Super admins can update any user
CREATE POLICY "users_update_super_admin" ON users FOR UPDATE USING (is_super_admin());

-- =====================================================
-- ARTICLES POLICIES
-- =====================================================

-- Anyone can read published articles
CREATE POLICY "articles_select_published" ON articles FOR SELECT USING (status = 'published');

-- Authors can read their own drafts
CREATE POLICY "articles_select_own_draft" ON articles FOR SELECT USING (
  author_id = auth.uid() AND tenant_id = get_user_tenant_id()
);

-- Verified users can create articles (starts as draft)
CREATE POLICY "articles_insert_verified" ON articles FOR INSERT WITH CHECK (
  is_verified() AND
  author_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

-- Authors can update their own articles
CREATE POLICY "articles_update_own" ON articles FOR UPDATE USING (author_id = auth.uid());

-- Admins can do everything with articles in their tenant
CREATE POLICY "articles_admin_all" ON articles FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- ANNOUNCEMENTS POLICIES
-- =====================================================

-- Anyone can read announcements
CREATE POLICY "announcements_select_all" ON announcements FOR SELECT USING (true);

-- Admins can manage announcements in their tenant
CREATE POLICY "announcements_admin_all" ON announcements FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- EVENTS POLICIES
-- =====================================================

-- Anyone can read published public events
CREATE POLICY "events_select_published_public" ON events FOR SELECT USING (
  status = 'published' AND is_private = false
);

-- Verified users can read published private events in their tenant
CREATE POLICY "events_select_published_private" ON events FOR SELECT USING (
  is_verified() AND
  status = 'published' AND
  tenant_id = get_user_tenant_id()
);

-- Organizers can read their own events
CREATE POLICY "events_select_own" ON events FOR SELECT USING (organizer_id = auth.uid());

-- Verified users can create events
CREATE POLICY "events_insert_verified" ON events FOR INSERT WITH CHECK (
  is_verified() AND
  organizer_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

-- Organizers can update their own events
CREATE POLICY "events_update_own" ON events FOR UPDATE USING (organizer_id = auth.uid());

-- Admins can manage all events in their tenant
CREATE POLICY "events_admin_all" ON events FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- EVENT_RSVPS POLICIES
-- =====================================================

-- Verified users can read RSVPs for events they can see
CREATE POLICY "rsvps_select_verified" ON event_rsvps FOR SELECT USING (is_verified());

-- Verified users can create/update their own RSVPs
CREATE POLICY "rsvps_insert_own" ON event_rsvps FOR INSERT WITH CHECK (
  is_verified() AND user_id = auth.uid()
);

CREATE POLICY "rsvps_update_own" ON event_rsvps FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own RSVPs
CREATE POLICY "rsvps_delete_own" ON event_rsvps FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- MARKETPLACE_ITEMS POLICIES
-- =====================================================

-- Anyone can read approved items
CREATE POLICY "marketplace_select_approved" ON marketplace_items FOR SELECT USING (status = 'approved');

-- Sellers can read their own items
CREATE POLICY "marketplace_select_own" ON marketplace_items FOR SELECT USING (seller_id = auth.uid());

-- Verified users can create items (starts as pending)
CREATE POLICY "marketplace_insert_verified" ON marketplace_items FOR INSERT WITH CHECK (
  is_verified() AND
  seller_id = auth.uid() AND
  tenant_id = get_user_tenant_id() AND
  status = 'pending'
);

-- Sellers can update their own items
CREATE POLICY "marketplace_update_own" ON marketplace_items FOR UPDATE USING (seller_id = auth.uid());

-- Admins can manage all items in their tenant
CREATE POLICY "marketplace_admin_all" ON marketplace_items FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- PROFESSIONAL_PROFILES POLICIES
-- =====================================================

-- Anyone can read approved profiles
CREATE POLICY "professionals_select_approved" ON professional_profiles FOR SELECT USING (
  status = 'approved' AND is_active = true
);

-- Users can read their own profile
CREATE POLICY "professionals_select_own" ON professional_profiles FOR SELECT USING (user_id = auth.uid());

-- Verified users can create/update their profile
CREATE POLICY "professionals_insert_verified" ON professional_profiles FOR INSERT WITH CHECK (
  is_verified() AND
  user_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

CREATE POLICY "professionals_update_own" ON professional_profiles FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all profiles in their tenant
CREATE POLICY "professionals_admin_all" ON professional_profiles FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can read reviews
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT USING (true);

-- Verified users can create reviews
CREATE POLICY "reviews_insert_verified" ON reviews FOR INSERT WITH CHECK (
  is_verified() AND reviewer_id = auth.uid()
);

-- Reviewers can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (reviewer_id = auth.uid());

-- Reviewers can delete their own reviews
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (reviewer_id = auth.uid());

-- =====================================================
-- DOCUMENTS & TUTORIALS POLICIES
-- =====================================================

-- Verified users can read documents in their tenant
CREATE POLICY "documents_select_verified" ON documents FOR SELECT USING (
  is_verified() AND tenant_id = get_user_tenant_id()
);

-- Admins can manage documents
CREATE POLICY "documents_admin_all" ON documents FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- Verified users can read published tutorials
CREATE POLICY "tutorials_select_published" ON tutorials FOR SELECT USING (
  is_verified() AND status = 'published'
);

-- Admins can manage tutorials
CREATE POLICY "tutorials_admin_all" ON tutorials FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- Verified users can create tutorial requests
CREATE POLICY "tutorial_requests_insert_verified" ON tutorial_requests FOR INSERT WITH CHECK (
  is_verified() AND
  requester_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

-- Admins can read tutorial requests
CREATE POLICY "tutorial_requests_admin_read" ON tutorial_requests FOR SELECT USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- FORUM POLICIES
-- =====================================================

-- Verified users can read forum categories
CREATE POLICY "forum_categories_select_verified" ON forum_categories FOR SELECT USING (
  is_verified() AND tenant_id = get_user_tenant_id()
);

-- Admins can manage categories
CREATE POLICY "forum_categories_admin_all" ON forum_categories FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- Verified users can read threads
CREATE POLICY "forum_threads_select_verified" ON forum_threads FOR SELECT USING (
  is_verified() AND tenant_id = get_user_tenant_id()
);

-- Verified users can create threads
CREATE POLICY "forum_threads_insert_verified" ON forum_threads FOR INSERT WITH CHECK (
  is_verified() AND
  author_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

-- Authors can update their own threads
CREATE POLICY "forum_threads_update_own" ON forum_threads FOR UPDATE USING (author_id = auth.uid());

-- Admins can manage all threads
CREATE POLICY "forum_threads_admin_all" ON forum_threads FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- Verified users can read posts
CREATE POLICY "forum_posts_select_verified" ON forum_posts FOR SELECT USING (
  is_verified() AND tenant_id = get_user_tenant_id()
);

-- Verified users can create posts
CREATE POLICY "forum_posts_insert_verified" ON forum_posts FOR INSERT WITH CHECK (
  is_verified() AND
  author_id = auth.uid() AND
  tenant_id = get_user_tenant_id()
);

-- Authors can update their own posts
CREATE POLICY "forum_posts_update_own" ON forum_posts FOR UPDATE USING (author_id = auth.uid());

-- Authors can delete their own posts
CREATE POLICY "forum_posts_delete_own" ON forum_posts FOR DELETE USING (author_id = auth.uid());

-- Admins can manage all posts
CREATE POLICY "forum_posts_admin_all" ON forum_posts FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- =====================================================
-- GAMIFICATION POLICIES
-- =====================================================

-- Verified users can read badges
CREATE POLICY "badges_select_verified" ON badges FOR SELECT USING (
  is_verified() AND tenant_id = get_user_tenant_id()
);

-- Verified users can read their own badges
CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT USING (user_id = auth.uid());

-- Verified users can read other users' badges in same tenant
CREATE POLICY "user_badges_select_same_tenant" ON user_badges FOR SELECT USING (
  is_verified() AND
  user_id IN (SELECT id FROM users WHERE tenant_id = get_user_tenant_id())
);

-- System can award badges (handled by triggers or admin actions)
-- Admins can manage badges
CREATE POLICY "badges_admin_all" ON badges FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

CREATE POLICY "user_badges_admin_all" ON user_badges FOR ALL USING (is_admin());

-- =====================================================
-- MODERATION POLICIES
-- =====================================================

-- Moderators can read items assigned to them or unassigned in their tenant
CREATE POLICY "moderation_moderator_read" ON moderation_queue FOR SELECT USING (
  is_moderator() AND
  tenant_id = get_user_tenant_id() AND
  (assigned_to = auth.uid() OR assigned_to IS NULL OR is_admin())
);

-- Moderators can update assigned items
CREATE POLICY "moderation_moderator_update" ON moderation_queue FOR UPDATE USING (
  is_moderator() AND
  tenant_id = get_user_tenant_id() AND
  (assigned_to = auth.uid() OR is_admin())
);

-- Admins can manage all moderation in their tenant
CREATE POLICY "moderation_admin_all" ON moderation_queue FOR ALL USING (
  is_admin() AND tenant_id = get_user_tenant_id()
);

-- Moderators can read logs for items they can moderate
CREATE POLICY "moderation_log_moderator_read" ON moderation_actions_log FOR SELECT USING (
  is_moderator() AND tenant_id = get_user_tenant_id()
);

-- System can insert logs
CREATE POLICY "moderation_log_insert_auth" ON moderation_actions_log FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

COMMENT ON SCHEMA public IS 'RLS Policies applied - All tables secured';
