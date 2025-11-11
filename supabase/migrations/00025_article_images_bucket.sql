-- Migration: Create article-images storage bucket with RLS policies
-- Purpose: Store article cover images and inline editor images
-- Max size: 5MB per image (enforced in application layer)
-- Allowed formats: JPEG, PNG, WebP, SVG

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create public bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,  -- Public read access
  5242880,  -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy 1: Admins and super_admins can upload images
CREATE POLICY "article_images_upload_admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy 2: Public read access to all article images
CREATE POLICY "article_images_read_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- Policy 3: Admins can update/replace images
CREATE POLICY "article_images_update_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy 4: Admins can delete images
CREATE POLICY "article_images_delete_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Note: Bucket configured with 5MB file size limit and JPEG/PNG/WebP/SVG mime types
