-- =====================================================
-- TOPIC IMAGES STORAGE BUCKET
-- =====================================================
-- This migration adds the storage bucket for images in topic messages.
-- Similar to topic-audio but for images.
-- =====================================================

-- 1. Create the topic-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'topic-images',
  'topic-images',
  true,  -- Public for viewing
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- 2. RLS Policies for topic-images bucket

-- Allow authenticated users to upload images
CREATE POLICY "topic_images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'topic-images'
);

-- Allow public read access (anyone can view images in messages)
CREATE POLICY "topic_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'topic-images'
);

-- Allow users to delete their own images
-- Image path format: {topic_id}/{user_id}/{timestamp}.{ext}
CREATE POLICY "topic_images_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'topic-images'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
