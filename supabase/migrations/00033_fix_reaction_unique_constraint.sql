-- =====================================================
-- FIX: Allow only ONE reaction per user per message
--
-- Problem: Current constraint UNIQUE(message_id, user_id, emoji) allows
-- the same user to add multiple different emojis to the same message.
--
-- Solution: Change to UNIQUE(message_id, user_id) so each user can only
-- have ONE reaction per message. Changing emoji will UPDATE, not INSERT.
-- =====================================================

-- 1. Drop the existing constraint that allows multiple emojis per user
ALTER TABLE topic_message_reactions
DROP CONSTRAINT IF EXISTS unique_reaction;

-- 2. Clean up: Keep only the most recent reaction per user per message
-- (in case there are duplicates from before this fix)
DELETE FROM topic_message_reactions a
USING topic_message_reactions b
WHERE a.message_id = b.message_id
  AND a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- 3. Add new constraint: ONE reaction per user per message
ALTER TABLE topic_message_reactions
ADD CONSTRAINT unique_user_message_reaction UNIQUE(message_id, user_id);

-- 4. Update the sync_message_reactions trigger to handle updates
CREATE OR REPLACE FUNCTION sync_message_reactions()
RETURNS TRIGGER AS $$
DECLARE
  v_message_id UUID;
BEGIN
  v_message_id := COALESCE(NEW.message_id, OLD.message_id);

  UPDATE topic_messages SET
    reactions = (
      SELECT COALESCE(
        jsonb_object_agg(emoji, user_ids),
        '{}'::jsonb
      )
      FROM (
        SELECT emoji, array_agg(user_id::text) as user_ids
        FROM topic_message_reactions
        WHERE message_id = v_message_id
        GROUP BY emoji
      ) sub
    ),
    updated_at = NOW()
  WHERE id = v_message_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate trigger to also fire on UPDATE
DROP TRIGGER IF EXISTS trigger_sync_reactions ON topic_message_reactions;

CREATE TRIGGER trigger_sync_reactions
AFTER INSERT OR UPDATE OR DELETE ON topic_message_reactions
FOR EACH ROW EXECUTE FUNCTION sync_message_reactions();

-- 6. Update comment
COMMENT ON TABLE topic_message_reactions IS
'Emoji reactions on messages. Each user can have only ONE reaction per message.
Changing the emoji will update the existing reaction, not add a new one.';
