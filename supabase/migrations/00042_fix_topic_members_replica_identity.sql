-- =====================================================
-- FIX TOPIC_MEMBERS REPLICA IDENTITY
-- =====================================================
-- This is required to ensure that Supabase Realtime sends the full row data
-- (including topic_id) in UPDATE events, even if those columns weren't changed.
-- Without this, the client might receive an update with missing topic_id,
-- causing the unread count update to fail or be misattributed.

ALTER TABLE topic_members REPLICA IDENTITY FULL;
