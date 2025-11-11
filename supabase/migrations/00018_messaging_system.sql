-- =====================================================
-- MESSAGING SYSTEM (Conversations & Messages)
-- =====================================================

-- Create conversation_status ENUM
DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  status conversation_status DEFAULT 'active' NOT NULL,

  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_preview TEXT DEFAULT '' NOT NULL,

  unread_count_buyer INT DEFAULT 0 NOT NULL CHECK (unread_count_buyer >= 0),
  unread_count_seller INT DEFAULT 0 NOT NULL CHECK (unread_count_seller >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one conversation per item-buyer pair
  UNIQUE(marketplace_item_id, buyer_id)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_marketplace_item ON conversations(marketplace_item_id);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Index for fetching user's conversations efficiently
CREATE INDEX idx_conversations_participants ON conversations(buyer_id, seller_id, last_message_at DESC);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read BOOLEAN DEFAULT false NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update conversations.updated_at on UPDATE
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update messages.updated_at on UPDATE
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can view conversations where they are buyer or seller
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = buyer_id OR
    auth.uid() = seller_id
  );

-- Conversations: Buyers can create conversations (when messaging a seller)
CREATE POLICY "Buyers can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id AND
    auth.uid() != seller_id
  );

-- Conversations: Participants can update conversations (for marking as read, etc.)
CREATE POLICY "Participants can update conversations"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = buyer_id OR
    auth.uid() = seller_id
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Messages: Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
      AND conversations.status = 'active'
    )
  );

-- Messages: Users can update messages (for marking as read)
CREATE POLICY "Participants can update messages"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- =====================================================
-- HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE conversations IS 'Marketplace item conversations between buyers and sellers';
COMMENT ON TABLE messages IS 'Individual messages within conversations';

COMMENT ON COLUMN conversations.status IS 'Conversation status: active (can send messages) or closed (read-only)';
COMMENT ON COLUMN conversations.last_message_preview IS 'Preview of the last message (first 100 chars) for list views';
COMMENT ON COLUMN conversations.unread_count_buyer IS 'Number of unread messages for the buyer';
COMMENT ON COLUMN conversations.unread_count_seller IS 'Number of unread messages for the seller';
