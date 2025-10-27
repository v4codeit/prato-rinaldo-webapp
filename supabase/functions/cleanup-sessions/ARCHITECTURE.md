# Cleanup Sessions - Architecture Documentation

## Overview

The `cleanup-sessions` Edge Function is a serverless maintenance task that runs on Supabase's edge network to perform automated cleanup of expired data. It's designed to run daily via cron scheduling to maintain database hygiene and optimize storage costs.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Platform                           │
│                                                                   │
│  ┌─────────────────┐                                             │
│  │  Cron Scheduler │                                             │
│  │  (0 2 * * *)    │                                             │
│  └────────┬────────┘                                             │
│           │ Trigger (Daily 2 AM UTC)                             │
│           v                                                       │
│  ┌─────────────────────────────────────────┐                     │
│  │   cleanup-sessions Edge Function        │                     │
│  │   (Deno Runtime)                        │                     │
│  │                                         │                     │
│  │  ┌───────────────────────────────────┐ │                     │
│  │  │  Main Handler                     │ │                     │
│  │  │  - Parse parameters              │ │                     │
│  │  │  - Initialize Supabase client    │ │                     │
│  │  │  - Execute cleanup operations    │ │                     │
│  │  │  - Return statistics             │ │                     │
│  │  └───────────────┬───────────────────┘ │                     │
│  │                  │                       │                     │
│  │                  v                       │                     │
│  │  ┌───────────────────────────────────┐ │                     │
│  │  │  Cleanup Operations (Parallel)    │ │                     │
│  │  │                                   │ │                     │
│  │  │  1. cleanupAuthSessions()        │ │                     │
│  │  │  2. cleanupTempFiles()           │ │                     │
│  │  │  3. cleanupExpiredEventRsvps()   │ │                     │
│  │  │  4. cleanupModerationQueue()     │ │                     │
│  │  └───────────────────────────────────┘ │                     │
│  └─────────────────────────────────────────┘                     │
│           │                                                       │
│           v                                                       │
│  ┌─────────────────────────────────────────┐                     │
│  │         Supabase Services               │                     │
│  │                                         │                     │
│  │  ┌──────────────┐  ┌────────────────┐  │                     │
│  │  │  PostgreSQL  │  │  Storage API   │  │                     │
│  │  │  Database    │  │  (S3-compat)   │  │                     │
│  │  └──────────────┘  └────────────────┘  │                     │
│  └─────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Main Handler (`serve()`)

**Responsibilities:**
- HTTP request handling (POST, OPTIONS for CORS)
- Parameter parsing (dry_run, force flags)
- Supabase client initialization
- Orchestration of cleanup operations
- Statistics collection and response formatting
- Error handling and logging

**Flow:**
1. Validate environment variables
2. Create Supabase admin client (service role)
3. Parse query parameters
4. Execute cleanup operations sequentially
5. Collect statistics
6. Return JSON response

### 2. Cleanup Operations

#### 2.1 `cleanupAuthSessions()`

**Purpose:** Identify inactive users for manual review

**Logic:**
```sql
SELECT id, email, last_signed_in
FROM users
WHERE last_signed_in < (NOW() - INTERVAL '30 days')
LIMIT 100
```

**Note:** Does not automatically delete users (requires manual review for security/compliance)

**Output:** Count of inactive users logged

#### 2.2 `cleanupTempFiles()`

**Purpose:** Delete temporary files from storage buckets

**Logic:**
1. Iterate through buckets: `["avatars", "articles", "events", "marketplace", "documents"]`
2. List files in `temp/` folder of each bucket
3. Filter files older than 7 days
4. Delete in batches

**API Calls:**
```javascript
supabase.storage
  .from(bucketName)
  .list("temp")
  .then(files => filter by age)
  .then(paths => supabase.storage.from(bucketName).remove(paths))
```

**Output:** Total files deleted across all buckets

#### 2.3 `cleanupExpiredEventRsvps()`

**Purpose:** Remove RSVPs for events that ended 30+ days ago

**Logic:**
1. Find expired events:
```sql
SELECT id, title, start_date
FROM events
WHERE start_date < (NOW() - INTERVAL '30 days')
LIMIT 100
```

2. For each expired event:
   - Count RSVPs
   - Delete all RSVPs for that event
```sql
DELETE FROM event_rsvps
WHERE event_id = $1
```

**Output:** Total RSVPs deleted

#### 2.4 `cleanupModerationQueue()`

**Purpose:** Clean up old rejected moderation items

**Logic:**
1. Query old moderation queue items:
```sql
SELECT id, item_type, item_id, created_at
FROM moderation_queue
WHERE created_at < (NOW() - INTERVAL '90 days')
LIMIT 100
```

2. For each item, verify rejection status in source table:
   - `marketplace_items.status = 'rejected'`
   - `professional_profiles.status = 'rejected'`
   - `forum_threads.status = 'rejected'`
   - `forum_posts.status = 'rejected'`
   - `tutorial_requests.status = 'rejected'`

3. Delete confirmed rejected items:
```sql
DELETE FROM moderation_queue
WHERE id IN ($1, $2, ...)
```

**Output:** Total moderation items deleted

### 3. Batch Processing

All operations use batch processing to prevent timeouts:

```typescript
const BATCH_SIZE = 100;

// Process in chunks
while (hasMore) {
  const items = await fetchBatch(offset, BATCH_SIZE);
  await processBatch(items);
  offset += BATCH_SIZE;
  hasMore = items.length === BATCH_SIZE;
}
```

### 4. Safety Mechanisms

#### Dry Run Mode
```typescript
if (dryRun) {
  console.log(`[DRY RUN] Would delete ${count} items`);
  // Don't execute actual deletion
} else {
  await executeDelete();
}
```

#### Force Flag
```typescript
if (!dryRun && !force) {
  return {
    error: "Safety check: Use ?dry_run=true or ?force=true"
  };
}
```

#### Error Isolation
```typescript
try {
  await operation1();
} catch (error) {
  stats.errors.push(error.message);
  // Continue with next operation
}
```

## Data Flow

### Request Flow
```
HTTP POST
  ↓
Query Params (dry_run, force)
  ↓
Environment Check (SUPABASE_URL, SERVICE_KEY)
  ↓
Initialize Supabase Client (Admin)
  ↓
Sequential Cleanup Operations
  ↓
Statistics Aggregation
  ↓
JSON Response
```

### Cleanup Flow (per operation)
```
Query Expired Items
  ↓
Filter/Validate
  ↓
Batch Processing
  ↓
Execute Deletion (if not dry run)
  ↓
Log Results
  ↓
Update Statistics
  ↓
Handle Errors
```

## Security Model

### Authentication
- **No JWT verification** - Function runs as system task
- Uses **Service Role Key** for full database access
- Cron trigger doesn't require authentication

### Authorization
- Service role bypasses Row Level Security (RLS)
- Direct access to all tables and buckets
- Safety checks prevent accidental mass deletion

### Audit Trail
- All operations logged to console
- Statistics include counts and timestamps
- Errors tracked in response object

## Performance Characteristics

### Time Complexity
- **Auth Sessions:** O(n) where n = inactive users (max 100/run)
- **Temp Files:** O(b × f) where b = buckets, f = files per bucket
- **Event RSVPs:** O(e × r) where e = expired events, r = RSVPs per event
- **Moderation Queue:** O(m) where m = old moderation items

### Space Complexity
- **Memory:** O(BATCH_SIZE) - processes in batches
- **Network:** Streaming deletion, minimal buffering

### Expected Duration
- **Small dataset** (<1000 items): 5-15 seconds
- **Medium dataset** (1000-10000 items): 30-60 seconds
- **Large dataset** (>10000 items): 1-3 minutes

### Optimization Strategies
1. Batch processing prevents memory overflow
2. Sequential operations prevent database lock contention
3. Early returns skip unnecessary operations
4. Indexed queries for fast filtering

## Error Handling

### Error Types

1. **Environment Errors**
   - Missing SUPABASE_URL or SERVICE_ROLE_KEY
   - Action: Return 500, don't proceed

2. **Database Errors**
   - Query failures, connection issues
   - Action: Log error, continue with next operation

3. **Storage Errors**
   - Bucket not found, permission issues
   - Action: Skip bucket, log warning

4. **Timeout Errors**
   - Operation exceeds function timeout
   - Action: Partial cleanup, log stats so far

### Error Recovery
```typescript
try {
  await cleanupOperation();
} catch (error) {
  console.error("Operation failed:", error);
  stats.errors.push(error.message);
  // Continue - don't fail entire function
}
```

## Monitoring & Observability

### Logs
```javascript
console.log("Starting cleanup operations...");
console.log(`Found ${count} expired items`);
console.log(`Deleted ${count} items from ${table}`);
console.error("Error in cleanupXXX:", error);
```

### Metrics (in response)
```json
{
  "stats": {
    "authSessions": 5,
    "tempFiles": 23,
    "eventRsvps": 147,
    "moderationQueue": 12,
    "errors": [],
    "startTime": "...",
    "endTime": "...",
    "durationMs": 83456
  }
}
```

### Alerts (recommended)
- Function execution failures
- Errors array not empty
- Duration exceeds threshold (e.g., >2 minutes)
- No items cleaned for multiple runs (may indicate issue)

## Configuration

### Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Retention Policies (in code)
```typescript
const CONFIG = {
  AUTH_SESSION_EXPIRY_DAYS: 30,
  TEMP_FILE_EXPIRY_DAYS: 7,
  EVENT_RSVP_CLEANUP_DAYS: 30,
  MODERATION_CLEANUP_DAYS: 90,
  BATCH_SIZE: 100,
  DRY_RUN: false,
};
```

### Cron Schedule
```toml
[functions.cleanup-sessions.schedule]
cron = "0 2 * * *"  # Daily at 2 AM UTC
```

## Deployment Architecture

### Edge Function Runtime
- **Platform:** Supabase Edge Functions (Deno Deploy)
- **Runtime:** Deno 1.x
- **Region:** Global edge network (auto-deployed)
- **Timeout:** 10 minutes (default for cron functions)

### Dependencies
```json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2.39.0"
  }
}
```

### Deployment Process
1. `supabase functions deploy cleanup-sessions`
2. Set environment secrets
3. Configure cron in config.toml or Dashboard
4. Test with `?dry_run=true`
5. Monitor logs

## Scalability Considerations

### Current Limitations
- 10-minute function timeout
- Batch size limits (100 items/batch)
- Single-threaded processing

### Scaling Strategies

1. **Horizontal Scaling**
   - Split into multiple functions by operation type
   - Run in parallel

2. **Vertical Scaling**
   - Increase batch size for faster processing
   - Optimize queries with better indexes

3. **Temporal Scaling**
   - Run more frequently (e.g., every 6 hours)
   - Process smaller chunks each time

4. **Database Scaling**
   - Add indexes on cleanup filter columns
   - Partition large tables by date

## Future Enhancements

1. **Configurable Retention Policies**
   - Store policies in database
   - Per-tenant customization

2. **Detailed Reporting**
   - Email summaries to admins
   - Dashboard integration

3. **Selective Cleanup**
   - Run only specific operations
   - Skip operations via parameters

4. **Soft Deletes**
   - Archive before deleting
   - Recovery mechanism

5. **Metrics Export**
   - Send stats to analytics platform
   - Track trends over time

## Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/manual)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-from-list)
- [Cron Expression Syntax](https://crontab.guru/)
