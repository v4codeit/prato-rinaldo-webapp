-- =====================================================
-- VOICE MESSAGES SUPPORT
-- =====================================================
-- This migration adds support for voice messages in topics:
-- 1. Adds 'voice' value to topic_message_type enum
-- 2. Creates 'topic-audio' storage bucket
-- 3. Sets up RLS policies for audio uploads
-- 4. topic_messages.metadata JSONB column already exists
--    We use it to store voice metadata:
--    {
--      "voice": {
--        "duration": number,      -- duration in seconds
--        "size": number,          -- file size in bytes
--        "mimeType": string,      -- audio/webm, audio/mp4, etc.
--        "waveform": number[]     -- 64 samples, 0-127 values for visualization
--      }
--    }
-- =====================================================

-- 0. Add 'voice' to topic_message_type enum
ALTER TYPE topic_message_type ADD VALUE IF NOT EXISTS 'voice';

-- 1. Create the topic-audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'topic-audio',
  'topic-audio',
  true,  -- Public for playback (no auth required to listen)
  10485760,  -- 10MB max (generous for voice messages)
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']::text[];

-- 2. RLS Policies for topic-audio bucket

-- Allow authenticated users to upload audio
CREATE POLICY "topic_audio_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'topic-audio'
);

-- Allow public read access (anyone can listen to voice messages)
CREATE POLICY "topic_audio_select_public"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'topic-audio'
);

-- Allow users to delete their own audio files
-- Audio path format: {topic_id}/{user_id}/{timestamp}.webm
CREATE POLICY "topic_audio_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'topic-audio'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Add Realtime publication for topic_messages if not already added
-- (topic_messages should already be in realtime from 00030_topics_system.sql)

-- 4. Add comment for documentation
COMMENT ON TABLE topic_messages IS
'Topic messages table. Supports text and voice messages.
Voice messages store audio in topic-audio bucket and metadata in JSONB:
{
  "voice": {
    "duration": 15.5,
    "size": 245760,
    "mimeType": "audio/webm",
    "waveform": [23, 45, 67, ...]
  }
}';
