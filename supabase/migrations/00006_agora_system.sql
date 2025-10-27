-- =====================================================
-- AGORÀ SYSTEM (Civic Proposals & Roadmap)
-- =====================================================
-- Migration to create the Agorà feature - a civic proposal
-- and voting system inspired by FeatureBase, adapted for
-- neighborhood committees.

-- Create ENUM types for Agorà
CREATE TYPE proposal_status AS ENUM (
  'proposed',      -- Just created, visible to all
  'under_review',  -- Committee is evaluating
  'approved',      -- Approved, appears in roadmap
  'in_progress',   -- Being implemented
  'completed',     -- Completed with date
  'declined'       -- Rejected with reason
);

CREATE TYPE proposal_vote_type AS ENUM ('up', 'down');

-- Update moderation_item_type to include proposal types
ALTER TYPE moderation_item_type ADD VALUE IF NOT EXISTS 'proposal';
ALTER TYPE moderation_item_type ADD VALUE IF NOT EXISTS 'proposal_comment';

-- =====================================================
-- PROPOSAL CATEGORIES TABLE
-- Admin-managed categories for proposals
-- =====================================================
CREATE TABLE proposal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(20) DEFAULT '#0891b2',
  order_index INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_proposal_categories_tenant ON proposal_categories(tenant_id);
CREATE INDEX idx_proposal_categories_order ON proposal_categories(tenant_id, order_index);

-- =====================================================
-- PROPOSALS TABLE
-- Main proposals table
-- =====================================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES proposal_categories(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,

  -- Status
  status proposal_status DEFAULT 'proposed' NOT NULL,

  -- Voting
  upvotes INT DEFAULT 0 NOT NULL,
  downvotes INT DEFAULT 0 NOT NULL,
  score INT GENERATED ALWAYS AS (upvotes - downvotes) STORED,

  -- Roadmap fields
  planned_date DATE,
  completed_date DATE,
  decline_reason TEXT,

  -- Meta
  view_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_proposals_tenant ON proposals(tenant_id);
CREATE INDEX idx_proposals_category ON proposals(category_id);
CREATE INDEX idx_proposals_author ON proposals(author_id);
CREATE INDEX idx_proposals_status ON proposals(tenant_id, status);
CREATE INDEX idx_proposals_score ON proposals(tenant_id, score DESC);
CREATE INDEX idx_proposals_created ON proposals(tenant_id, created_at DESC);

-- =====================================================
-- PROPOSAL VOTES TABLE
-- Upvote/downvote tracking
-- =====================================================
CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type proposal_vote_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each user can vote once per proposal
  CONSTRAINT unique_user_proposal_vote UNIQUE (proposal_id, user_id)
);

CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_user ON proposal_votes(user_id);

-- =====================================================
-- PROPOSAL COMMENTS TABLE
-- Discussion on proposals
-- =====================================================
CREATE TABLE proposal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_proposal_comments_tenant ON proposal_comments(tenant_id);
CREATE INDEX idx_proposal_comments_proposal ON proposal_comments(proposal_id, created_at ASC);
CREATE INDEX idx_proposal_comments_user ON proposal_comments(user_id);

-- =====================================================
-- PROPOSAL STATUS HISTORY TABLE
-- Audit trail for status changes
-- =====================================================
CREATE TABLE proposal_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  old_status proposal_status,
  new_status proposal_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_proposal_status_history_proposal ON proposal_status_history(proposal_id, created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update proposal vote counts
CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE proposals SET upvotes = upvotes + 1 WHERE id = NEW.proposal_id;
    ELSE
      UPDATE proposals SET downvotes = downvotes + 1 WHERE id = NEW.proposal_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE proposals SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.proposal_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE proposals SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.proposal_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE proposals SET upvotes = upvotes - 1 WHERE id = OLD.proposal_id;
    ELSE
      UPDATE proposals SET downvotes = downvotes - 1 WHERE id = OLD.proposal_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote counts
CREATE TRIGGER trigger_update_proposal_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_counts();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_proposal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO proposal_status_history (proposal_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
CREATE TRIGGER trigger_log_proposal_status_change
AFTER UPDATE ON proposals
FOR EACH ROW EXECUTE FUNCTION log_proposal_status_change();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_proposals_updated_at
BEFORE UPDATE ON proposals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_proposal_categories_updated_at
BEFORE UPDATE ON proposal_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_proposal_comments_updated_at
BEFORE UPDATE ON proposal_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
