-- =====================================================
-- ADD topic_message_reactions TO REALTIME PUBLICATION
-- =====================================================
-- Error: "Unable to subscribe to changes with given parameters.
-- Please check Realtime is enabled for the given connect parameters:
-- [schema: public, table: topic_message_reactions, filters: []]"
--
-- The table was created in 00030_topics_system.sql but was NOT added
-- to the supabase_realtime publication (only topic_messages, topic_members, topics were added)
-- =====================================================

-- Add topic_message_reactions to the Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE topic_message_reactions;

COMMENT ON TABLE topic_message_reactions IS
'Emoji reactions on messages. Realtime enabled for live updates.';
