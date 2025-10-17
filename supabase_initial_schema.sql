-- Prato Rinaldo WebApp - Initial PostgreSQL Schema
-- Converted from MySQL/Drizzle to PostgreSQL for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============ ENUMS ============
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
CREATE TYPE subscription_type AS ENUM ('monthly', 'annual');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE membership_type AS ENUM ('resident', 'domiciled', 'landowner');
CREATE TYPE municipality AS ENUM ('san_cesareo', 'zagarolo');
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator');
CREATE TYPE committee_role AS ENUM ('president', 'vice_president', 'secretary', 'treasurer', 'board_member', 'council_member');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE event_type AS ENUM ('public', 'private', 'fundraiser');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE marketplace_status AS ENUM ('pending', 'approved', 'rejected', 'sold');
CREATE TYPE professional_category AS ENUM ('plumbing', 'electrical', 'construction', 'gardening', 'cleaning', 'it', 'legal', 'medical', 'education', 'other');
CREATE TYPE availability_type AS ENUM ('volunteer', 'paid', 'both');
CREATE TYPE tutorial_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE moderation_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE item_type AS ENUM ('marketplace_item', 'professional_profile', 'forum_thread', 'forum_post', 'tutorial_request', 'event', 'article');
CREATE TYPE moderation_action AS ENUM ('approve', 'reject', 'flag', 'unflag');

-- ============ TENANTS ============
CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo VARCHAR(500),
  primary_color VARCHAR(20) DEFAULT '#0891b2',
  secondary_color VARCHAR(20) DEFAULT '#f97316',
  hero_image VARCHAR(500),
  contact_email VARCHAR(320),
  contact_phone VARCHAR(50),
  address TEXT,
  social_facebook VARCHAR(500),
  social_instagram VARCHAR(500),
  social_twitter VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
  maintenance_message TEXT,
  subscription_status subscription_status DEFAULT 'trial' NOT NULL,
  subscription_type subscription_type,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ USERS (extends auth.users) ============
-- Note: Supabase Auth manages auth.users, we create a public.users table for additional data
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role user_role DEFAULT 'user' NOT NULL,
  verification_status verification_status DEFAULT 'pending' NOT NULL,
  
  -- Onboarding fields
  membership_type membership_type,
  street VARCHAR(255),
  street_number VARCHAR(20),
  zip_code VARCHAR(10) DEFAULT '00030',
  municipality municipality,
  
  -- Household info (optional)
  household_size INTEGER,
  has_minors BOOLEAN DEFAULT FALSE,
  minors_count INTEGER,
  has_seniors BOOLEAN DEFAULT FALSE,
  seniors_count INTEGER,
  
  -- Admin roles and permissions
  admin_role admin_role,
  admin_permissions JSONB,
  
  -- Committee roles
  committee_role committee_role,
  is_in_board BOOLEAN DEFAULT FALSE,
  is_in_council BOOLEAN DEFAULT FALSE,
  
  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Additional fields
  phone VARCHAR(50),
  bio TEXT,
  avatar VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_signed_in TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_verification ON users(verification_status);
CREATE INDEX idx_users_role ON users(role);

-- ============ ARTICLES (News/Blog) ============
CREATE TABLE articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image VARCHAR(500),
  status content_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_articles_tenant ON articles(tenant_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE status = 'published';

-- ============ EVENTS ============
CREATE TABLE events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  event_type event_type DEFAULT 'public' NOT NULL,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  image VARCHAR(500),
  max_participants INTEGER,
  fundraiser_goal DECIMAL(10, 2),
  fundraiser_current DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_start_date ON events(start_date DESC);

-- ============ EVENT RSVPS ============
CREATE TABLE event_rsvps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  guests_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);

-- ============ MARKETPLACE ITEMS ============
CREATE TABLE marketplace_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  images JSONB,
  category VARCHAR(100),
  status marketplace_status DEFAULT 'pending' NOT NULL,
  donation_percentage INTEGER DEFAULT 0 CHECK (donation_percentage >= 0 AND donation_percentage <= 100),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketplace_tenant ON marketplace_items(tenant_id);
CREATE INDEX idx_marketplace_seller ON marketplace_items(seller_id);
CREATE INDEX idx_marketplace_status ON marketplace_items(status);

-- ============ PROFESSIONAL PROFILES ============
CREATE TABLE professional_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category professional_category NOT NULL,
  availability availability_type DEFAULT 'volunteer' NOT NULL,
  hourly_rate DECIMAL(10, 2),
  phone VARCHAR(50),
  email VARCHAR(320),
  website VARCHAR(500),
  status moderation_status DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_professional_profiles_tenant ON professional_profiles(tenant_id);
CREATE INDEX idx_professional_profiles_user ON professional_profiles(user_id);
CREATE INDEX idx_professional_profiles_category ON professional_profiles(category);
CREATE INDEX idx_professional_profiles_status ON professional_profiles(status);

-- ============ FORUM CATEGORIES ============
CREATE TABLE forum_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forum_categories_tenant ON forum_categories(tenant_id);

-- ============ FORUM THREADS ============
CREATE TABLE forum_threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  status moderation_status DEFAULT 'approved' NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forum_threads_tenant ON forum_threads(tenant_id);
CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX idx_forum_threads_pinned ON forum_threads(is_pinned DESC, updated_at DESC);

-- ============ FORUM POSTS ============
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  thread_id TEXT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status moderation_status DEFAULT 'approved' NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);

-- ============ TUTORIAL REQUESTS ============
CREATE TABLE tutorial_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  status tutorial_status DEFAULT 'pending' NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tutorial_requests_tenant ON tutorial_requests(tenant_id);
CREATE INDEX idx_tutorial_requests_status ON tutorial_requests(status);

-- ============ DOCUMENTS/RESOURCES ============
CREATE TABLE documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_category ON documents(category);

-- ============ BADGES ============
CREATE TABLE badges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_badges_tenant ON badges(tenant_id);

-- ============ USER BADGES ============
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ============ USER POINTS ============
CREATE TABLE user_points (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON user_points(user_id);

-- ============ MODERATION QUEUE ============
CREATE TABLE moderation_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  item_id TEXT NOT NULL,
  priority moderation_priority DEFAULT 'medium' NOT NULL,
  report_reasons JSONB,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moderation_queue_tenant ON moderation_queue(tenant_id);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority DESC, created_at ASC);
CREATE INDEX idx_moderation_queue_assigned ON moderation_queue(assigned_to);
CREATE INDEX idx_moderation_queue_item ON moderation_queue(item_type, item_id);

-- ============ MODERATION ACTIONS LOG ============
CREATE TABLE moderation_actions_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  queue_item_id TEXT NOT NULL REFERENCES moderation_queue(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action moderation_action NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moderation_actions_queue ON moderation_actions_log(queue_item_id);
CREATE INDEX idx_moderation_actions_moderator ON moderation_actions_log(moderator_id);

-- ============ FUNCTIONS ============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON event_rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON marketplace_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_profiles_updated_at BEFORE UPDATE ON professional_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorial_requests_updated_at BEFORE UPDATE ON tutorial_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON moderation_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

