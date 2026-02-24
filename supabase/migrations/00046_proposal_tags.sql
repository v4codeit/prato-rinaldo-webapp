-- =====================================================
-- PROPOSAL TAGS SYSTEM
-- =====================================================
-- Migration to add a flexible tagging system for Agora proposals.
-- Tags allow categorization beyond the main category (Online/Offline,
-- Urgente, Idea, Problema, etc.)

-- =====================================================
-- PROPOSAL TAGS TABLE
-- Admin-managed tags for proposals
-- =====================================================
CREATE TABLE proposal_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#6366f1',
  icon VARCHAR(10),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each tag slug must be unique within a tenant
  CONSTRAINT unique_tag_slug_per_tenant UNIQUE (tenant_id, slug)
);

-- Indexes for efficient querying
CREATE INDEX idx_proposal_tags_tenant ON proposal_tags(tenant_id);
CREATE INDEX idx_proposal_tags_slug ON proposal_tags(tenant_id, slug);
CREATE INDEX idx_proposal_tags_active ON proposal_tags(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_proposal_tags_order ON proposal_tags(tenant_id, order_index);

-- =====================================================
-- PROPOSAL TAG ASSIGNMENTS TABLE
-- Junction table for many-to-many relationship
-- =====================================================
CREATE TABLE proposal_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES proposal_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each tag can only be assigned once per proposal
  CONSTRAINT unique_proposal_tag UNIQUE (proposal_id, tag_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_proposal_tag_assignments_proposal ON proposal_tag_assignments(proposal_id);
CREATE INDEX idx_proposal_tag_assignments_tag ON proposal_tag_assignments(tag_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on proposal_tags
CREATE TRIGGER trigger_proposal_tags_updated_at
BEFORE UPDATE ON proposal_tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE proposal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_tag_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROPOSAL TAGS POLICIES
-- =====================================================

-- Everyone can view active tags
CREATE POLICY "proposal_tags_select_all"
ON proposal_tags FOR SELECT
USING (is_active = true);

-- Admins can view all tags (including inactive)
CREATE POLICY "proposal_tags_select_admin"
ON proposal_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- Only admins can insert tags
CREATE POLICY "proposal_tags_insert_admin"
ON proposal_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- Only admins can update tags
CREATE POLICY "proposal_tags_update_admin"
ON proposal_tags FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- Only admins can delete tags
CREATE POLICY "proposal_tags_delete_admin"
ON proposal_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- PROPOSAL TAG ASSIGNMENTS POLICIES
-- =====================================================

-- Everyone can view tag assignments
CREATE POLICY "proposal_tag_assignments_select_all"
ON proposal_tag_assignments FOR SELECT
USING (true);

-- Proposal authors can assign tags to their own proposals
CREATE POLICY "proposal_tag_assignments_insert_author"
ON proposal_tag_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_id
    AND proposals.author_id = auth.uid()
  )
);

-- Admins and board members can assign tags to any proposal
CREATE POLICY "proposal_tag_assignments_insert_admin"
ON proposal_tag_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.admin_role IN ('admin', 'super_admin', 'moderator')
      OR users.is_in_board = true
    )
  )
);

-- Proposal authors can remove tags from their own proposals
CREATE POLICY "proposal_tag_assignments_delete_author"
ON proposal_tag_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_id
    AND proposals.author_id = auth.uid()
  )
);

-- Admins and board members can remove tags from any proposal
CREATE POLICY "proposal_tag_assignments_delete_admin"
ON proposal_tag_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.admin_role IN ('admin', 'super_admin', 'moderator')
      OR users.is_in_board = true
    )
  )
);

-- =====================================================
-- SEED DATA - Default Tags
-- =====================================================

-- Insert default tags for the existing tenant (prato-rinaldo)
-- Uses a CTE to get the tenant_id dynamically
INSERT INTO proposal_tags (tenant_id, name, slug, description, color, icon, order_index, is_active)
SELECT
  t.id,
  tag_data.name,
  tag_data.slug,
  tag_data.description,
  tag_data.color,
  tag_data.icon,
  tag_data.order_index,
  true
FROM tenants t
CROSS JOIN (
  VALUES
    ('Online', 'online', 'Proposte relative a servizi digitali, piattaforma o comunicazione online', '#3b82f6', '🌐', 1),
    ('Offline', 'offline', 'Eventi, attivita o iniziative che si svolgono di persona nella comunita', '#22c55e', '🏘️', 2),
    ('Urgente', 'urgente', 'Proposte che richiedono attenzione prioritaria o tempestiva', '#ef4444', '⚡', 3),
    ('Idea', 'idea', 'Brainstorming, suggerimenti creativi o proposte esplorative', '#eab308', '💡', 4),
    ('Problema', 'problema', 'Segnalazione di problemi, disservizi o situazioni da risolvere', '#f97316', '🐛', 5)
) AS tag_data(name, slug, description, color, icon, order_index)
WHERE t.slug = 'prato-rinaldo';

-- =====================================================
-- COMMENTS
-- =====================================================
--
-- Schema Design Notes:
--
-- 1. proposal_tags: Master table for available tags
--    - tenant_id: Multi-tenant isolation
--    - slug: URL-friendly identifier for filtering
--    - color: HEX color for UI badges (e.g., "#3b82f6")
--    - icon: Emoji for visual recognition
--    - order_index: Controls display order in UI
--    - is_active: Soft delete / hide without removing
--
-- 2. proposal_tag_assignments: Many-to-many junction
--    - ON DELETE CASCADE: Removing a proposal or tag cleans up assignments
--    - UNIQUE constraint prevents duplicate assignments
--
-- 3. RLS Policies:
--    - Tags are readable by everyone (active only for non-admins)
--    - Tag CRUD restricted to admins
--    - Assignment creation: author OR admin/board
--    - Assignment deletion: author OR admin/board
--
-- Usage Examples:
--
-- Get all tags for a proposal:
--   SELECT pt.* FROM proposal_tags pt
--   JOIN proposal_tag_assignments pta ON pta.tag_id = pt.id
--   WHERE pta.proposal_id = 'proposal-uuid'
--   ORDER BY pt.order_index;
--
-- Get proposals with a specific tag:
--   SELECT p.* FROM proposals p
--   JOIN proposal_tag_assignments pta ON pta.proposal_id = p.id
--   JOIN proposal_tags pt ON pt.id = pta.tag_id
--   WHERE pt.slug = 'urgente';
--
-- Filter by multiple tags (AND):
--   SELECT p.* FROM proposals p
--   WHERE EXISTS (SELECT 1 FROM proposal_tag_assignments WHERE proposal_id = p.id
--                 AND tag_id IN (SELECT id FROM proposal_tags WHERE slug = 'online'))
--   AND EXISTS (SELECT 1 FROM proposal_tag_assignments WHERE proposal_id = p.id
--               AND tag_id IN (SELECT id FROM proposal_tags WHERE slug = 'urgente'));
