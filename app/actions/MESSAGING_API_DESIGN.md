# Messaging System - API Design & Architecture

## System Overview

The marketplace messaging system enables secure, real-time communication between buyers and sellers. It's built on Next.js Server Actions with Supabase PostgreSQL backend and comprehensive Row Level Security.

## Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Messaging Service                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │  Conversations   │    │    Messages      │             │
│  │   Management     │───▶│   Management     │             │
│  └──────────────────┘    └──────────────────┘             │
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌──────────────────────────────────────┐                  │
│  │     Notification Service             │                  │
│  │   (Unread counts, alerts)            │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌──────────────────┐            ┌──────────────────┐
│   Marketplace    │            │   User Service   │
│   Service        │            │                  │
└──────────────────┘            └──────────────────┘
```

## Database Schema

### Conversations Table

```sql
conversations (
  id                    UUID PRIMARY KEY,
  marketplace_item_id   UUID NOT NULL,     -- FK to marketplace_items
  buyer_id              UUID NOT NULL,     -- FK to users
  seller_id             UUID NOT NULL,     -- FK to users
  tenant_id             UUID NOT NULL,     -- FK to tenants
  status                conversation_status DEFAULT 'active',
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  unread_count_buyer    INT DEFAULT 0,
  unread_count_seller   INT DEFAULT 0,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,

  UNIQUE(marketplace_item_id, buyer_id)  -- One conversation per item-buyer
)
```

**Indexes:**
- `idx_conversations_marketplace_item` - Find conversations by item
- `idx_conversations_buyer` - Find buyer's conversations
- `idx_conversations_seller` - Find seller's conversations
- `idx_conversations_participants` - Composite for user conversations
- `idx_conversations_last_message` - Sort by activity

**Key Design Choices:**
- **Denormalized last_message_preview**: Avoids JOIN for list views
- **Separate unread counters**: Buyer and seller have independent counts
- **Status field**: Allows sellers to close conversations

### Messages Table

```sql
messages (
  id              UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,     -- FK to conversations
  sender_id       UUID NOT NULL,     -- FK to users
  content         TEXT NOT NULL,     -- Max 2000 chars
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
```

**Indexes:**
- `idx_messages_conversation` - Load messages by conversation
- `idx_messages_sender` - Track user's sent messages
- `idx_messages_unread` - Count unread messages efficiently

**Key Design Choices:**
- **No message editing**: Content is immutable after send
- **Per-message read status**: Granular read tracking
- **Content length limit**: Enforced at DB level (2000 chars)

## API Endpoints (Server Actions)

### 1. Get or Create Conversation

```typescript
getOrCreateConversation(marketplaceItemId: string)
  -> ActionResponse<ConversationWithDetails>
```

**Purpose**: Initiate messaging about a marketplace item

**Request Flow**:
```
1. Authenticate user
2. Validate marketplace item exists
3. Verify user ≠ seller
4. Check item not sold
5. Query for existing conversation
6. If exists → return
7. If not → create → return
```

**Response Example**:
```json
{
  "data": {
    "id": "conv-uuid",
    "marketplace_item_id": "item-uuid",
    "buyer_id": "user-uuid",
    "seller_id": "seller-uuid",
    "status": "active",
    "marketplace_item": {
      "id": "item-uuid",
      "title": "Mountain Bike",
      "price": 15000,
      "images": ["https://..."],
      "status": "approved"
    },
    "other_participant": {
      "id": "seller-uuid",
      "name": "Marco Rossi",
      "avatar": "https://..."
    },
    "unread_count": 0
  },
  "error": null
}
```

**Error Cases**:
- User not authenticated → 401 "Non autenticato"
- Item not found → 404 "Articolo non trovato"
- User is seller → 403 "Non puoi inviare messaggi a te stesso"
- Item sold → 409 "Questo articolo è già stato venduto"

### 2. Get My Conversations

```typescript
getMyConversations() -> ActionResponse<ConversationWithDetails[]>
```

**Purpose**: List all user's conversations

**Query Strategy**:
```sql
SELECT c.*,
       mi.title, mi.price, mi.images,
       u_buyer.name AS buyer_name, u_buyer.avatar AS buyer_avatar,
       u_seller.name AS seller_name, u_seller.avatar AS seller_avatar
FROM conversations c
JOIN marketplace_items mi ON c.marketplace_item_id = mi.id
JOIN users u_buyer ON c.buyer_id = u_buyer.id
JOIN users u_seller ON c.seller_id = u_seller.id
WHERE c.buyer_id = $user_id OR c.seller_id = $user_id
ORDER BY c.last_message_at DESC
LIMIT 50
```

**Response Example**:
```json
{
  "data": [
    {
      "id": "conv-1",
      "marketplace_item": { "title": "Mountain Bike", ... },
      "other_participant": { "name": "Marco Rossi", ... },
      "last_message_preview": "È ancora disponibile?",
      "last_message_at": "2025-11-03T10:30:00Z",
      "unread_count": 2,
      "status": "active"
    },
    // ... more conversations
  ],
  "error": null
}
```

**Optimization Notes**:
- Limited to 50 most recent
- Single query with JOINs (no N+1)
- Index-optimized sorting

### 3. Get Conversation By ID

```typescript
getConversationById(conversationId: string)
  -> ActionResponse<ConversationWithDetails>
```

**Purpose**: Get single conversation details

**Side Effects**:
- Resets unread count for current user
- Does NOT mark messages as read (separate action)

**Authorization**:
- User must be buyer OR seller
- RLS enforces at database level

### 4. Get Conversation Messages

```typescript
getConversationMessages(conversationId: string, limit?: number, offset?: number)
  -> ActionResponse<MessageWithSender[]>
```

**Purpose**: Paginated message loading

**Parameters**:
- `conversationId`: Required
- `limit`: Default 50, max 100
- `offset`: For pagination

**Side Effects**:
- Marks messages as read (where sender ≠ current user)

**Response Example**:
```json
{
  "data": [
    {
      "id": "msg-1",
      "conversation_id": "conv-1",
      "sender_id": "user-1",
      "content": "Ciao, è ancora disponibile?",
      "is_read": true,
      "created_at": "2025-11-03T10:00:00Z",
      "sender": {
        "id": "user-1",
        "name": "Giovanni Bianchi",
        "avatar": "https://..."
      }
    },
    // ... more messages
  ],
  "error": null
}
```

**Pagination Strategy**:
```typescript
// Load initial messages
const { data: messages } = await getConversationMessages(convId, 50, 0);

// Load older messages (infinite scroll up)
const { data: older } = await getConversationMessages(convId, 50, 50);
```

### 5. Send Message

```typescript
sendMessage(conversationId: string, content: string)
  -> ActionResponse<MessageWithSender>
```

**Purpose**: Send new message

**Validation**:
```typescript
content: z.string()
  .min(1, "Il messaggio non può essere vuoto")
  .max(2000, "Il messaggio è troppo lungo")
```

**Side Effects**:
1. Insert message
2. Update `last_message_at`
3. Update `last_message_preview`
4. Increment other user's unread count
5. Revalidate `/messages` paths

**Error Cases**:
- Conversation closed → 409 "Questa conversazione è stata chiusa"
- Content too long → 400 "Il messaggio è troppo lungo"
- Not participant → 403 "Non autorizzato"

### 6. Mark Conversation As Read

```typescript
markConversationAsRead(conversationId: string)
  -> ActionResponse<{ success: true }>
```

**Purpose**: Bulk mark all messages as read

**Database Operations**:
```sql
-- Mark messages as read
UPDATE messages
SET is_read = true
WHERE conversation_id = $1
  AND sender_id != $2
  AND is_read = false;

-- Reset unread count
UPDATE conversations
SET unread_count_buyer = 0  -- or unread_count_seller
WHERE id = $1;
```

### 7. Close Conversation

```typescript
closeConversation(conversationId: string)
  -> ActionResponse<{ success: true }>
```

**Purpose**: Close conversation (seller only)

**Authorization**:
- Only seller can close
- Enforced in server action

**Effects**:
- Status → 'closed'
- New messages blocked
- Read-only mode for buyer

### 8. Reopen Conversation

```typescript
reopenConversation(conversationId: string)
  -> ActionResponse<{ success: true }>
```

**Purpose**: Reactivate closed conversation

**Authorization**: Seller only

## Security Architecture

### Row Level Security (RLS)

**conversations policies**:
```sql
-- SELECT: View own conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- INSERT: Buyers can create conversations
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id AND auth.uid() != seller_id);

-- UPDATE: Participants can update
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

**messages policies**:
```sql
-- SELECT: View messages in own conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid()
             OR conversations.seller_id = auth.uid())
    )
  );

-- INSERT: Send messages in own active conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid()
             OR conversations.seller_id = auth.uid())
        AND conversations.status = 'active'
    )
  );
```

### Application-Level Security

**Additional Checks**:
1. **Self-messaging prevention**: Buyer cannot be seller
2. **Item availability**: No conversations for sold items
3. **Conversation status**: No messages in closed conversations
4. **Content validation**: Zod schemas enforce limits
5. **Rate limiting**: Consider adding per-user message rate limits

## Data Consistency

### Unread Count Management

**Increment on send**:
```typescript
// When buyer sends message
UPDATE conversations
SET unread_count_seller = unread_count_seller + 1
WHERE id = conversation_id;

// When seller sends message
UPDATE conversations
SET unread_count_buyer = unread_count_buyer + 1
WHERE id = conversation_id;
```

**Reset on read**:
```typescript
// When buyer reads
UPDATE conversations
SET unread_count_buyer = 0
WHERE id = conversation_id;
```

**Potential Race Conditions**:
- Multiple messages sent simultaneously
- Solution: Use database-level increment (no race)

### Last Message Preview

**Update strategy**:
```typescript
last_message_preview = content.substring(0, 100)
```

**Considerations**:
- Truncate at 100 chars
- No markdown/HTML processing needed
- Updated on every message send

## Performance Optimization

### Query Optimization

**Conversation list** (50 conversations):
- Single query with JOINs
- Indexed sort by `last_message_at`
- No N+1 problem

**Message loading** (50 messages):
- Indexed by `(conversation_id, created_at)`
- Pagination with OFFSET/LIMIT
- Consider cursor-based pagination for very large conversations

### Caching Strategy

**Static**: None (conversations are dynamic)

**Server**:
- Cache conversation metadata for 30s
- No cache for unread counts

**Client**:
- SWR/React Query for optimistic updates
- Invalidate on send/receive

### Database Indexes

**Critical indexes**:
```sql
-- Conversation list query
CREATE INDEX idx_conversations_participants
  ON conversations(buyer_id, seller_id, last_message_at DESC);

-- Message loading
CREATE INDEX idx_messages_conversation
  ON messages(conversation_id, created_at ASC);

-- Unread count
CREATE INDEX idx_messages_unread
  ON messages(conversation_id, is_read)
  WHERE is_read = false;
```

**Index size estimates** (10k conversations, 100k messages):
- conversations table: ~2 MB
- messages table: ~50 MB
- All indexes: ~20 MB
- **Total**: ~72 MB (very manageable)

## Scaling Considerations

### Current Capacity

**Database**:
- PostgreSQL scales to millions of rows
- Current schema handles 100k+ conversations easily
- Indexes optimized for query patterns

**Server Actions**:
- Stateless, horizontally scalable
- No session management needed
- Can scale to 1000s of RPS

### Bottlenecks & Solutions

**Potential bottleneck**: Unread count queries
- **Solution**: Denormalized counts in conversations table (✓ done)

**Potential bottleneck**: Large conversation history
- **Solution**: Pagination + cursor-based for 1000+ messages

**Potential bottleneck**: Real-time updates
- **Solution**: Implement Supabase Realtime subscriptions

### Horizontal Scaling

**Database**:
- Read replicas for conversation list queries
- Write primary for messages
- Connection pooling (PgBouncer)

**Application**:
- Stateless server actions scale infinitely
- Deploy to edge (Vercel Edge Functions)
- CDN for static assets

## Monitoring & Observability

### Key Metrics

**Performance**:
- `conversation_list_load_time` - p95 < 200ms
- `message_send_latency` - p95 < 100ms
- `message_load_latency` - p95 < 150ms

**Business**:
- `conversations_created_per_day`
- `messages_sent_per_day`
- `avg_messages_per_conversation`
- `conversion_rate` (messages → sale)

**Errors**:
- `auth_failures_per_minute`
- `rls_policy_violations`
- `validation_errors`

### Logging Strategy

**Log levels**:
- ERROR: Failed message sends, RLS violations
- WARN: Closed conversation attempts, rate limits
- INFO: Conversation creation, status changes
- DEBUG: All queries (development only)

## Future Enhancements

### Phase 2: Real-time
- Supabase Realtime subscriptions
- Typing indicators
- Online status
- Message delivery receipts

### Phase 3: Rich Features
- Image/file attachments
- Message reactions (emoji)
- Message search
- Conversation archive
- Block users

### Phase 4: Scale
- Message queue for notifications
- Read replicas
- Cursor-based pagination
- Conversation analytics

## API Response Examples

### Success Response
```typescript
{
  data: T,
  error: null
}
```

### Error Response
```typescript
{
  data: null,
  error: "Human-readable error message in Italian"
}
```

### Common HTTP Status Equivalents
- 200 OK → `{ data, error: null }`
- 400 Bad Request → `{ data: null, error: "Validation message" }`
- 401 Unauthorized → `{ data: null, error: "Non autenticato" }`
- 403 Forbidden → `{ data: null, error: "Non autorizzato" }`
- 404 Not Found → `{ data: null, error: "Risorsa non trovata" }`
- 409 Conflict → `{ data: null, error: "Conflict message" }`
- 500 Server Error → `{ data: null, error: "Errore del server" }`

## Technology Stack

- **Backend**: Next.js 16 Server Actions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS)
- **Validation**: Zod schemas
- **Type Safety**: TypeScript
- **Caching**: Next.js revalidation
- **Deployment**: Vercel Edge

## Summary

This messaging system provides:
- ✅ Secure buyer-seller communication
- ✅ Real-time unread counts
- ✅ Conversation management (close/reopen)
- ✅ Paginated message history
- ✅ Row-level security
- ✅ Horizontal scalability
- ✅ Type-safe APIs
- ✅ Optimized performance
- ✅ Production-ready architecture
