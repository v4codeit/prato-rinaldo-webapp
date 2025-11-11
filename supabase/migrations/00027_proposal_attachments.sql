-- =====================================================
-- PROPOSAL ATTACHMENTS
-- Supporto per upload immagini/PDF su proposals
-- =====================================================

-- Create proposal_attachments table
CREATE TABLE IF NOT EXISTS proposal_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_proposal_attachments_proposal ON proposal_attachments(proposal_id);
CREATE INDEX idx_proposal_attachments_user ON proposal_attachments(user_id);

-- RLS Policies
ALTER TABLE proposal_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT: Public (everyone can view)
CREATE POLICY "proposal_attachments_select" ON proposal_attachments
  FOR SELECT
  USING (true);

-- INSERT: Verified residents only
CREATE POLICY "proposal_attachments_insert" ON proposal_attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.verification_status = 'approved'
    )
  );

-- DELETE: Owner OR admin/moderator
CREATE POLICY "proposal_attachments_delete" ON proposal_attachments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.admin_role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Create storage bucket for proposal attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-attachments',
  'proposal-attachments',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- SELECT: Public (everyone can view)
CREATE POLICY "proposal_attachments_storage_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'proposal-attachments');

-- INSERT: Verified residents only
CREATE POLICY "proposal_attachments_storage_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'proposal-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.verification_status = 'approved'
    )
  );

-- DELETE: Owner OR admin/moderator
CREATE POLICY "proposal_attachments_storage_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'proposal-attachments'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.admin_role IN ('admin', 'super_admin', 'moderator')
      )
    )
  );
