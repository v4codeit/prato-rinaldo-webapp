-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role;
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS admin_role;
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS committee_role;
    CREATE TYPE committee_role AS ENUM ('president', 'vice_president', 'secretary', 'treasurer', 'board_member', 'council_member');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS membership_type;
    CREATE TYPE membership_type AS ENUM ('resident', 'domiciled', 'landowner');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS municipality;
    CREATE TYPE municipality AS ENUM ('san_cesareo', 'zagarolo');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS verification_status;
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS content_status;
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS marketplace_status;
    CREATE TYPE marketplace_status AS ENUM ('pending', 'approved', 'sold', 'rejected');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS event_rsvp_status;
    CREATE TYPE event_rsvp_status AS ENUM ('going', 'maybe', 'not_going');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS payment_status;
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS moderation_status;
    CREATE TYPE moderation_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS moderation_priority;
    CREATE TYPE moderation_priority AS ENUM ('low', 'medium', 'high', 'urgent');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS moderation_item_type;
    CREATE TYPE moderation_item_type AS ENUM ('marketplace', 'professional_profile', 'forum_thread', 'forum_post', 'tutorial_request');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS moderation_action_type;
    CREATE TYPE moderation_action_type AS ENUM ('created', 'assigned', 'approved', 'rejected', 'reported', 'edited', 'deleted');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS subscription_status;
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
END $$;
DO $$ BEGIN
    DROP TYPE IF EXISTS subscription_type;
    CREATE TYPE subscription_type AS ENUM ('monthly', 'annual');
END $$;

-- =====================================================
-- TENANTS TABLE (Multi-tenant configuration)
-- =====================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo TEXT,
  primary_color VARCHAR(20) DEFAULT '#0891b2',
  secondary_color VARCHAR(20) DEFAULT '#f97316',
  hero_image TEXT,
  contact_email VARCHAR(320),
  contact_phone VARCHAR(50),
  address TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  maintenance_mode BOOLEAN DEFAULT false NOT NULL,
  maintenance_message TEXT,
  subscription_status subscription_status DEFAULT 'trial' NOT NULL,
  subscription_type subscription_type,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- =====================================================
-- USERS TABLE (Profile + extended auth.users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  email VARCHAR(320),
  role user_role DEFAULT 'user' NOT NULL,
  verification_status verification_status DEFAULT 'pending' NOT NULL,

  -- Onboarding Step 1
  membership_type membership_type,
  street VARCHAR(255),
  street_number VARCHAR(20),
  zip_code VARCHAR(10) DEFAULT '00030',
  municipality municipality,

  -- Onboarding Step 2
  household_size INT,
  has_minors BOOLEAN DEFAULT false,
  minors_count INT,
  has_seniors BOOLEAN DEFAULT false,
  seniors_count INT,

  -- Admin & Committee Roles
  admin_role admin_role,
  admin_permissions JSONB DEFAULT '{}',
  committee_role committee_role,
  is_in_board BOOLEAN DEFAULT false NOT NULL,
  is_in_council BOOLEAN DEFAULT false NOT NULL,

  -- Profile
  phone VARCHAR(50),
  bio TEXT,
  avatar TEXT,

  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  onboarding_step INT DEFAULT 0 NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_verification ON users(verification_status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- ARTICLES TABLE (News/Blog posts)
-- =====================================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  status content_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_slug ON articles(tenant_id, slug);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE status = 'published';

-- =====================================================
-- ANNOUNCEMENTS TABLE (Pinned messages)
-- =====================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_announcements_pinned ON announcements(tenant_id, is_pinned DESC, created_at DESC);

-- =====================================================
-- EVENTS TABLE (Public & Private events)
-- =====================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  cover_image TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_private BOOLEAN DEFAULT false NOT NULL,
  max_attendees INT,
  requires_payment BOOLEAN DEFAULT false NOT NULL,
  price INT DEFAULT 0 CHECK (price >= 0),
  status content_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- =====================================================
-- EVENT_RSVPS TABLE (Event attendance tracking)
-- =====================================================
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status event_rsvp_status DEFAULT 'going' NOT NULL,
  payment_status payment_status,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_rsvps_tenant ON event_rsvps(tenant_id);

-- =====================================================
-- MARKETPLACE_ITEMS TABLE (Items for sale)
-- =====================================================
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  price INT NOT NULL CHECK (price >= 0),
  committee_percentage INT DEFAULT 0 NOT NULL CHECK (committee_percentage >= 0 AND committee_percentage <= 100),
  images JSONB DEFAULT '[]',
  status marketplace_status DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_marketplace_tenant_status ON marketplace_items(tenant_id, status);
CREATE INDEX idx_marketplace_seller ON marketplace_items(seller_id);
CREATE INDEX idx_marketplace_created ON marketplace_items(created_at DESC);

-- =====================================================
-- PROFESSIONAL_PROFILES TABLE (Professional directory)
-- =====================================================
CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_volunteer BOOLEAN DEFAULT false NOT NULL,
  contact_email VARCHAR(320),
  contact_phone VARCHAR(50),
  website TEXT,
  status marketplace_status DEFAULT 'pending' NOT NULL,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  report_count INT DEFAULT 0 NOT NULL,
  is_reported BOOLEAN DEFAULT false NOT NULL,
  reported_by JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_professionals_tenant ON professional_profiles(tenant_id);
CREATE INDEX idx_professionals_user ON professional_profiles(user_id);
CREATE INDEX idx_professionals_category ON professional_profiles(category);
CREATE INDEX idx_professionals_status ON professional_profiles(status);

-- =====================================================
-- REVIEWS TABLE (Professional feedback)
-- =====================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_profile_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviews_profile ON reviews(professional_profile_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- =====================================================
-- DOCUMENTS TABLE (File storage references)
-- =====================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_category ON documents(category);

-- =====================================================
-- TUTORIALS TABLE (How-to guides)
-- =====================================================
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  cover_image TEXT,
  video_url TEXT,
  status content_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tutorials_tenant ON tutorials(tenant_id);
CREATE INDEX idx_tutorials_status ON tutorials(status);

-- =====================================================
-- TUTORIAL_REQUESTS TABLE (User requests)
-- =====================================================
CREATE TABLE tutorial_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(500) NOT NULL,
  description TEXT,
  status moderation_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tutorial_requests_tenant ON tutorial_requests(tenant_id);

-- =====================================================
-- FORUM TABLES (Category, Thread, Post)
-- =====================================================
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  order_index INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_forum_categories_tenant ON forum_categories(tenant_id);
CREATE INDEX idx_forum_categories_order ON forum_categories(tenant_id, order_index);

CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  view_count INT DEFAULT 0 NOT NULL,
  report_count INT DEFAULT 0 NOT NULL,
  is_reported BOOLEAN DEFAULT false NOT NULL,
  reported_by JSONB DEFAULT '[]',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_forum_threads_tenant ON forum_threads(tenant_id);
CREATE INDEX idx_forum_threads_category_pinned ON forum_threads(category_id, is_pinned DESC, last_activity_at DESC);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_id);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  report_count INT DEFAULT 0 NOT NULL,
  is_reported BOOLEAN DEFAULT false NOT NULL,
  reported_by JSONB DEFAULT '[]',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_forum_posts_tenant ON forum_posts(tenant_id);
CREATE INDEX idx_forum_posts_thread_created ON forum_posts(thread_id, created_at ASC);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);

-- =====================================================
-- GAMIFICATION TABLES (Badges, User Badges)
-- =====================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT,
  criteria TEXT,
  points INT DEFAULT 0 NOT NULL CHECK (points >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_badges_tenant ON badges(tenant_id);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- =====================================================
-- MODERATION_QUEUE TABLE (Centralized moderation)
-- =====================================================
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Item reference
  item_type moderation_item_type NOT NULL,
  item_id UUID NOT NULL,

  -- Denormalized data
  item_title VARCHAR(500),
  item_content TEXT,
  item_creator_id UUID,
  item_creator_name VARCHAR(255),

  -- Moderation status
  status moderation_status DEFAULT 'pending' NOT NULL,
  priority moderation_priority DEFAULT 'medium' NOT NULL,
  assigned_to UUID REFERENCES users(id),
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,

  -- Reporting
  report_count INT DEFAULT 0 NOT NULL,
  report_reasons JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_moderation_queue_tenant ON moderation_queue(tenant_id);
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_type ON moderation_queue(item_type);
CREATE INDEX idx_moderation_queue_assigned ON moderation_queue(assigned_to);
CREATE INDEX idx_moderation_queue_creator ON moderation_queue(item_creator_id);

-- =====================================================
-- MODERATION_ACTIONS_LOG TABLE (Audit trail)
-- =====================================================
CREATE TABLE moderation_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Reference
  queue_item_id UUID NOT NULL REFERENCES moderation_queue(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id UUID NOT NULL,

  -- Action details
  action moderation_action_type NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  performed_by_name VARCHAR(255),

  -- Status tracking
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  note TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_moderation_log_tenant ON moderation_actions_log(tenant_id);
CREATE INDEX idx_moderation_log_queue ON moderation_actions_log(queue_item_id);
CREATE INDEX idx_moderation_log_performer ON moderation_actions_log(performed_by);
CREATE INDEX idx_moderation_log_action ON moderation_actions_log(action);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_updated_at BEFORE UPDATE ON marketplace_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professional_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON moderation_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON DATABASE postgres IS 'Community Prato Rinaldo - Next.js 16 + Supabase';
