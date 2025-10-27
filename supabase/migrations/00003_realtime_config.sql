-- =====================================================
-- SUPABASE REALTIME CONFIGURATION
-- =====================================================

-- Enable realtime for forum tables (high-priority for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE forum_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;

-- Enable realtime for events RSVP (live attendee count)
ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps;

-- Enable realtime for moderation queue (moderator dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_queue;

-- Enable realtime for announcements (live notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- Optional: Enable for user badges (live gamification)
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;

COMMENT ON SCHEMA public IS 'Realtime enabled for forum, events, moderation, announcements';
