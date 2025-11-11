# Marketplace Messaging System - Implementation Guide

## Overview

This messaging system allows buyers to communicate with sellers about marketplace items. It provides a complete internal messaging solution with conversation management, real-time unread counts, and proper access controls.

## Architecture

### Database Schema

**conversations table:**
- One conversation per marketplace item-buyer pair
- Tracks conversation status (active/closed)
- Maintains unread counts for both buyer and seller
- Stores last message preview for list views

**messages table:**
- Individual messages within conversations
- Tracks read status per message
- Immutable content (no editing after send)
- Limited to 2000 characters per message

### Key Design Decisions

1. **One Conversation Per Item-Buyer Pair**: Enforced via UNIQUE constraint on `(marketplace_item_id, buyer_id)`
2. **Seller Can Close Conversations**: Only sellers can close/reopen conversations (e.g., after item is sold)
3. **Separate Unread Counts**: Each participant has their own unread counter
4. **Message Content Limit**: 2000 characters max to prevent abuse
5. **RLS Security**: Supabase Row Level Security ensures users can only access their own conversations

## Server Actions

### 1. getOrCreateConversation(marketplaceItemId)

**Purpose**: Start a conversation about a marketplace item

**Flow**:
1. Authenticate user (must be logged in)
2. Fetch marketplace item details
3. Verify user is not the seller (can't message yourself)
4. Check if item is available (not sold)
5. Look for existing conversation
6. If exists, return it
7. If not, create new conversation
8. Return conversation with item and seller details

**Returns**:
```typescript
{
  data: ConversationWithDetails | null,
  error: string | null
}
```

**Example Usage**:
```typescript
const { data: conversation, error } = await getOrCreateConversation(itemId);
if (error) {
  toast.error(error);
  return;
}
// Navigate to conversation
router.push(`/messages/${conversation.id}`);
```

### 2. getMyConversations()

**Purpose**: Get all conversations for the current user

**Flow**:
1. Authenticate user
2. Query conversations where user is buyer OR seller
3. Join with marketplace_items and users tables
4. Sort by last_message_at DESC
5. Format with appropriate "other participant" and unread count

**Returns**:
```typescript
{
  data: ConversationWithDetails[] | null,
  error: string | null
}
```

**UI Display**:
- Show marketplace item image and title
- Display other participant's name and avatar
- Show last message preview
- Display unread count badge
- Sort by most recent activity

### 3. getConversationById(conversationId)

**Purpose**: Get single conversation with full details

**Side Effects**:
- Resets unread count for current user
- Does NOT mark messages as read (that happens when loading messages)

**Flow**:
1. Authenticate user
2. Fetch conversation with joins
3. Verify user is participant (buyer or seller)
4. Reset unread count to 0
5. Format and return

**Returns**:
```typescript
{
  data: ConversationWithDetails | null,
  error: string | null
}
```

### 4. getConversationMessages(conversationId, limit?, offset?)

**Purpose**: Get messages with pagination

**Side Effects**:
- Marks unread messages as read (where sender != current user)

**Flow**:
1. Authenticate user
2. Verify user is participant
3. Fetch messages with sender info
4. Order by created_at ASC (oldest first, for chat UI)
5. Apply pagination (limit/offset)
6. Mark messages as read
7. Return formatted messages

**Returns**:
```typescript
{
  data: MessageWithSender[] | null,
  error: string | null
}
```

**Pagination Example**:
```typescript
// Initial load
const { data: messages } = await getConversationMessages(convId, 50, 0);

// Load more (infinite scroll)
const { data: olderMessages } = await getConversationMessages(convId, 50, 50);
```

### 5. sendMessage(conversationId, content)

**Purpose**: Send a new message

**Validation**:
- Content: 1-2000 characters (trimmed)
- Zod schema validation

**Side Effects**:
- Updates conversation.last_message_at
- Updates conversation.last_message_preview
- Increments unread count for other participant
- Revalidates `/messages` and `/messages/[id]` paths

**Flow**:
1. Authenticate user
2. Validate content (trim, check length)
3. Verify conversation exists and user is participant
4. Check conversation status (must be 'active')
5. Insert message
6. Update conversation metadata
7. Increment other participant's unread count
8. Return created message with sender info

**Returns**:
```typescript
{
  data: MessageWithSender | null,
  error: string | null
}
```

**Example Usage**:
```typescript
const { data: message, error } = await sendMessage(conversationId, messageText);
if (error) {
  toast.error(error);
  return;
}
// Message sent successfully
// UI will update via revalidation
```

### 6. markConversationAsRead(conversationId)

**Purpose**: Mark all messages as read

**Use Case**: User opens conversation but doesn't scroll through all messages

**Flow**:
1. Authenticate user
2. Verify user is participant
3. Mark all unread messages as read (where sender != current user)
4. Reset unread count to 0
5. Revalidate paths

**Returns**:
```typescript
{
  data: { success: true } | null,
  error: string | null
}
```

### 7. closeConversation(conversationId)

**Purpose**: Close conversation (seller only)

**Use Case**: Item sold, no more messages needed

**Restrictions**:
- Only seller can close
- Can't send new messages in closed conversation
- Can still view messages

**Flow**:
1. Authenticate user
2. Verify user is seller
3. Check not already closed
4. Update status to 'closed'
5. Revalidate paths

**Returns**:
```typescript
{
  data: { success: true } | null,
  error: string | null
}
```

### 8. reopenConversation(conversationId)

**Purpose**: Reopen closed conversation (seller only)

**Use Case**: Item back on market, or follow-up discussion needed

**Flow**:
1. Authenticate user
2. Verify user is seller
3. Check not already active
4. Update status to 'active'
5. Revalidate paths

**Returns**:
```typescript
{
  data: { success: true } | null,
  error: string | null
}
```

## Security

### Row Level Security (RLS) Policies

**conversations:**
- SELECT: User must be buyer or seller
- INSERT: User must be buyer (and not seller)
- UPDATE: User must be buyer or seller

**messages:**
- SELECT: User must be participant in conversation
- INSERT: User must be sender and participant, conversation must be active
- UPDATE: User must be participant (for marking as read)

### Additional Checks

1. **Prevent Self-Messaging**: Users cannot message themselves about their own items
2. **Sold Item Check**: Cannot create conversation for sold items
3. **Active Conversation Check**: Cannot send messages in closed conversations
4. **Seller-Only Operations**: Only sellers can close/reopen conversations

## Error Handling

All server actions return consistent format:
```typescript
{
  data: T | null,
  error: string | null
}
```

**Common Errors**:
- `"Non autenticato"` - User not logged in
- `"Non autorizzato"` - User not participant in conversation
- `"Articolo non trovato"` - Marketplace item doesn't exist
- `"Conversazione non trovata"` - Conversation doesn't exist
- `"Questa conversazione è stata chiusa"` - Trying to send message in closed conversation
- `"Solo il venditore può chiudere la conversazione"` - Buyer trying to close conversation

## UI Integration Checklist

### Marketplace Item Page
- [ ] "Contatta il venditore" button
- [ ] Call `getOrCreateConversation(itemId)`
- [ ] Navigate to `/messages/[conversationId]`
- [ ] Disable button if item is sold
- [ ] Hide button if user is the seller

### Messages List Page (`/messages`)
- [ ] Call `getMyConversations()`
- [ ] Display conversation list
- [ ] Show unread count badges
- [ ] Show last message preview
- [ ] Show marketplace item thumbnail
- [ ] Show other participant info
- [ ] Sort by most recent

### Conversation Detail Page (`/messages/[id]`)
- [ ] Call `getConversationById(id)` on mount
- [ ] Call `getConversationMessages(id)` for messages
- [ ] Display marketplace item header
- [ ] Display other participant info
- [ ] Chat interface with message list
- [ ] Message input form
- [ ] Send button calls `sendMessage(id, content)`
- [ ] Auto-scroll to bottom
- [ ] Show "Conversazione chiusa" if status is closed
- [ ] Show "Riapri conversazione" button if closed (seller only)
- [ ] Show "Chiudi conversazione" button if active (seller only)

### Real-time Updates (Optional)
- [ ] Set up Supabase Realtime subscription for messages
- [ ] Listen for INSERT on messages table
- [ ] Update UI when new message arrives
- [ ] Play notification sound
- [ ] Update unread counts

## Database Migration

Run the migration:
```bash
pnpm supabase db reset  # If in development
# OR
pnpm supabase migration up  # If in production
```

Migration file: `supabase/migrations/00018_messaging_system.sql`

## Testing Checklist

### Unit Tests
- [ ] Create conversation - success
- [ ] Create conversation - prevent self-messaging
- [ ] Create conversation - check for existing
- [ ] Send message - success
- [ ] Send message - validate content length
- [ ] Send message - check closed conversation
- [ ] Close conversation - seller only
- [ ] Reopen conversation - seller only

### Integration Tests
- [ ] Full conversation flow (create → send → read → close)
- [ ] Unread count updates correctly
- [ ] Last message preview updates
- [ ] RLS policies work correctly

### Manual Testing
- [ ] Buyer can start conversation
- [ ] Seller receives notification (if implemented)
- [ ] Messages display correctly
- [ ] Unread counts accurate
- [ ] Seller can close conversation
- [ ] Cannot send to closed conversation
- [ ] Seller can reopen conversation
- [ ] Pagination works
- [ ] Multiple conversations per user work

## Performance Considerations

### Indexes
The migration includes optimized indexes for:
- Fetching user's conversations: `idx_conversations_participants`
- Loading messages in conversation: `idx_messages_conversation`
- Counting unread messages: `idx_messages_unread`
- Sorting by activity: `idx_conversations_last_message`

### Query Optimization
- Limit conversations to 50 most recent
- Paginate messages (50 per page)
- Use `select()` with specific joins to avoid over-fetching
- Single queries with joins instead of multiple round trips

### Caching Strategy
- Use Next.js revalidation for static parts
- Real-time for active conversations
- Cache conversation list for 60 seconds
- No cache for unread counts (always fresh)

## Future Enhancements

1. **Real-time Messaging**: Use Supabase Realtime for instant delivery
2. **Push Notifications**: Notify users of new messages
3. **Email Notifications**: Send email for unread messages after X hours
4. **Message Attachments**: Support image/file uploads
5. **Message Reactions**: Add emoji reactions to messages
6. **Typing Indicators**: Show when other user is typing
7. **Message Search**: Full-text search within conversations
8. **Archive Conversations**: Soft delete/hide conversations
9. **Block Users**: Prevent specific users from messaging
10. **Message Reports**: Allow reporting inappropriate messages

## Support

For issues or questions:
1. Check RLS policies in Supabase dashboard
2. Verify migration ran successfully
3. Check browser console for error details
4. Review server logs for authentication issues
5. Test with different user roles (buyer/seller)
