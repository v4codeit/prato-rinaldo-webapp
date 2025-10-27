-- =====================================================
-- STORAGE BUCKETS & POLICIES
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('article-covers', 'article-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('event-covers', 'event-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('marketplace-items', 'marketplace-items', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('tenant-logos', 'tenant-logos', true, 2097152, ARRAY['image/png', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- Avatars bucket policies
CREATE POLICY "Avatar upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Article covers bucket policies (admin only)
CREATE POLICY "Article covers admin insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-covers' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Article covers admin update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-covers' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Article covers admin delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-covers' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Article covers read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-covers');

-- Event covers bucket policies (verified users)
CREATE POLICY "Event covers verified insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-covers' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND verification_status = 'approved'
  )
);

CREATE POLICY "Event covers own update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Event covers own delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Event covers read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-covers');

-- Marketplace items bucket policies (verified users)
CREATE POLICY "Marketplace verified insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-items' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND verification_status = 'approved'
  )
);

CREATE POLICY "Marketplace own update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'marketplace-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Marketplace own delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'marketplace-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Marketplace read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-items');

-- Documents bucket policies (admin only, verified users read)
CREATE POLICY "Documents admin insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Documents admin update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Documents admin delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Documents verified read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND verification_status = 'approved'
  )
);

-- Tenant logos bucket policies (super admin only)
CREATE POLICY "Tenant logos super admin insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-logos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant logos super admin update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-logos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant logos super admin delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-logos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant logos read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');
