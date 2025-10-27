# Cleanup Sessions - Example Responses

This document contains example API responses for different scenarios.

## Successful Dry Run

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 5,
    "tempFiles": 23,
    "eventRsvps": 147,
    "moderationQueue": 12,
    "errors": [],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:00:15.234Z",
    "durationMs": 15234
  },
  "message": "Dry run completed - no data was deleted"
}
```

## Successful Real Execution

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 5,
    "tempFiles": 23,
    "eventRsvps": 147,
    "moderationQueue": 12,
    "errors": [],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:01:23.456Z",
    "durationMs": 83456
  },
  "message": "Cleanup completed successfully"
}
```

## Safety Check (No Parameters)

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 0,
    "tempFiles": 0,
    "eventRsvps": 0,
    "moderationQueue": 0,
    "errors": [
      "Safety check: Use ?dry_run=true to test or ?force=true to execute cleanup"
    ],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:00:00.123Z",
    "durationMs": 123
  },
  "message": "Dry run completed - no data was deleted"
}
```

## Partial Success with Errors

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 5,
    "tempFiles": 15,
    "eventRsvps": 147,
    "moderationQueue": 0,
    "errors": [
      "Temp files (marketplace): Bucket 'marketplace' does not exist",
      "Moderation queue: relation \"moderation_queue\" does not exist"
    ],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:01:12.345Z",
    "durationMs": 72345
  },
  "message": "Cleanup completed successfully"
}
```

## Missing Environment Variables

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": false,
  "stats": {
    "authSessions": 0,
    "tempFiles": 0,
    "eventRsvps": 0,
    "moderationQueue": 0,
    "errors": [
      "Missing required environment variables"
    ],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:00:00.012Z",
    "durationMs": 12
  },
  "error": "Missing required environment variables"
}
```

## No Items to Clean

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 0,
    "tempFiles": 0,
    "eventRsvps": 0,
    "moderationQueue": 0,
    "errors": [],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:00:05.678Z",
    "durationMs": 5678
  },
  "message": "Cleanup completed successfully"
}
```

## Large Dataset Cleanup

**Request:**
```bash
curl -X POST 'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer eyJhbG..."
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "authSessions": 15,
    "tempFiles": 1247,
    "eventRsvps": 3456,
    "moderationQueue": 234,
    "errors": [],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:02:34.567Z",
    "durationMs": 154567
  },
  "message": "Cleanup completed successfully"
}
```

## CORS Preflight (OPTIONS)

**Request:**
```bash
curl -X OPTIONS 'https://abc123.supabase.co/functions/v1/cleanup-sessions' \
  -H "Origin: https://example.com"
```

**Response:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Content-Length: 2

ok
```

## Example Log Output

### Successful Execution
```
Starting cleanup operations...
Dry run mode: false

Checking auth sessions...
Found 5 users inactive for 30+ days
Inactive user: john@example.com (last signed in: 2025-08-15T10:30:00.000Z)
Inactive user: jane@example.com (last signed in: 2025-07-22T14:15:00.000Z)
Inactive user: bob@example.com (last signed in: 2025-08-01T09:00:00.000Z)
Inactive user: alice@example.com (last signed in: 2025-07-10T16:45:00.000Z)
Inactive user: charlie@example.com (last signed in: 2025-08-12T11:20:00.000Z)
Note: User accounts require manual review before deletion

Cleaning up temporary files...
No temp files in bucket 'avatars'
Found 5 expired temp files in 'articles'
Deleted 5 temp files from 'articles'
Found 12 expired temp files in 'events'
Deleted 12 temp files from 'events'
No temp files in bucket 'marketplace'
Found 6 expired temp files in 'documents'
Deleted 6 temp files from 'documents'
Total temp files processed: 23

Cleaning up expired event RSVPs...
Found 12 expired events
Found 15 RSVPs for expired event 'Community BBQ 2025' (2025-08-15T18:00:00.000Z)
Deleted 15 RSVPs for event 'Community BBQ 2025'
Found 23 RSVPs for expired event 'Neighborhood Watch Meeting' (2025-08-20T19:00:00.000Z)
Deleted 23 RSVPs for event 'Neighborhood Watch Meeting'
Found 45 RSVPs for expired event 'Summer Festival' (2025-08-25T14:00:00.000Z)
Deleted 45 RSVPs for event 'Summer Festival'
... (more events)
Total event RSVPs processed: 147

Cleaning up old moderation queue items...
Found 15 old moderation queue items
Marking moderation item abc123 (marketplace_item) for deletion
Marking moderation item def456 (professional_profile) for deletion
... (more items)
Found 12 rejected items to clean up
Deleted 12 moderation queue items
Total moderation queue items processed: 12

Cleanup completed successfully
Total duration: 83456ms
```

### Dry Run Output
```
Starting cleanup operations...
Dry run mode: true

Checking auth sessions...
Found 5 users inactive for 30+ days
Inactive user: john@example.com (last signed in: 2025-08-15T10:30:00.000Z)
... (user list)
Note: User accounts require manual review before deletion

Cleaning up temporary files...
No temp files in bucket 'avatars'
Found 5 expired temp files in 'articles'
[DRY RUN] Would delete 5 files from 'articles'
Found 12 expired temp files in 'events'
[DRY RUN] Would delete 12 files from 'events'
... (more buckets)
Total temp files processed: 23

Cleaning up expired event RSVPs...
Found 12 expired events
Found 15 RSVPs for expired event 'Community BBQ 2025' (2025-08-15T18:00:00.000Z)
[DRY RUN] Would delete 15 RSVPs for event 'Community BBQ 2025'
... (more events)
Total event RSVPs processed: 147

Cleaning up old moderation queue items...
Found 15 old moderation queue items
Marking moderation item abc123 (marketplace_item) for deletion
... (more items)
Found 12 rejected items to clean up
[DRY RUN] Would delete 12 moderation queue items
Total moderation queue items processed: 12

Cleanup completed successfully
Total duration: 15234ms
```

### Error Scenario
```
Starting cleanup operations...
Dry run mode: false

Checking auth sessions...
Error querying inactive users: relation "users" does not exist
Error in cleanupAuthSessions: relation "users" does not exist

Cleaning up temporary files...
No temp files in bucket 'avatars'
Warning: Could not list files in bucket 'marketplace': Bucket 'marketplace' does not exist
... (continues with other operations)

Cleaning up expired event RSVPs...
Error querying expired events: relation "events" does not exist
Error in cleanupExpiredEventRsvps: relation "events" does not exist

Cleaning up old moderation queue items...
Error querying moderation queue: relation "moderation_queue" does not exist
Error in cleanupModerationQueue: relation "moderation_queue" does not exist

Cleanup error: Database connection failed
```

## Testing Examples

### Test Script Output (test.ts)

```
Testing cleanup-sessions function...
Supabase URL: https://abc123.supabase.co

=== Test 1: Dry Run ===
Calling: https://abc123.supabase.co/functions/v1/cleanup-sessions?dry_run=true
Dry run response:
{
  "success": true,
  "stats": {
    "authSessions": 5,
    "tempFiles": 23,
    "eventRsvps": 147,
    "moderationQueue": 12,
    "errors": [],
    "startTime": "2025-10-26T02:00:00.000Z",
    "endTime": "2025-10-26T02:00:15.234Z",
    "durationMs": 15234
  },
  "message": "Dry run completed - no data was deleted"
}

=== Test Complete ===
To run force execution, uncomment Test 2 in test.ts
```

## Dashboard Integration Examples

### Stats Widget
```javascript
// Fetch cleanup stats
const response = await fetch(
  'https://abc123.supabase.co/functions/v1/cleanup-sessions?dry_run=true',
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${anonKey}` }
  }
);

const { stats } = await response.json();

// Display in dashboard
console.log(`Items to clean: ${
  stats.authSessions +
  stats.tempFiles +
  stats.eventRsvps +
  stats.moderationQueue
}`);
```

### Scheduled Report Email
```javascript
// Run cleanup and send email report
const response = await fetch(
  'https://abc123.supabase.co/functions/v1/cleanup-sessions?force=true',
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${anonKey}` }
  }
);

const { stats } = await response.json();

await sendEmail({
  to: 'admin@example.com',
  subject: 'Daily Cleanup Report',
  body: `
    Cleanup completed at ${stats.endTime}

    Inactive users logged: ${stats.authSessions}
    Temp files deleted: ${stats.tempFiles}
    Event RSVPs deleted: ${stats.eventRsvps}
    Moderation items deleted: ${stats.moderationQueue}

    Duration: ${stats.durationMs}ms
    Errors: ${stats.errors.length}
  `
});
```
