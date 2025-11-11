# Cleanup Sessions Edge Function

This Supabase Edge Function performs automated cleanup of expired sessions and temporary data to maintain database hygiene and optimize storage usage.

## Features

### Cleanup Operations

1. **Auth Sessions** (30+ days old)
   - Identifies inactive users who haven't signed in for 30+ days
   - Logs information for manual review (automatic user deletion requires manual approval)

2. **Temporary Files** (7+ days old)
   - Deletes files in `temp/` folders across all storage buckets
   - Covers: avatars, articles, events, marketplace, documents

3. **Event RSVPs** (30+ days after event)
   - Removes RSVPs for events that ended more than 30 days ago
   - Helps reduce database bloat from historical event data

4. **Moderation Queue** (90+ days old rejected items)
   - Cleans up rejected items from moderation queue
   - Verifies rejection status before deletion
   - Covers: marketplace items, professional profiles, forum content, tutorial requests

### Safety Features

- **Dry Run Mode**: Test without actual deletions
- **Batch Processing**: Processes data in batches (100 items) to prevent timeouts
- **Error Handling**: Continues processing even if individual operations fail
- **Detailed Logging**: Comprehensive logs for all operations
- **Rollback Protection**: Uses transactions where applicable
- **Safety Guards**: Requires explicit confirmation via query parameters

## Deployment

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Authenticated with Supabase: `supabase login`
- Project linked: `supabase link --project-ref your-project-ref`

### Deploy Function

```bash
# Deploy the function
supabase functions deploy cleanup-sessions

# Set environment variables (if not already set in Supabase dashboard)
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Schedule as Cron Job

Add to your `supabase/config.toml`:

```toml
[functions.cleanup-sessions]
verify_jwt = false

[functions.cleanup-sessions.schedule]
cron = "0 2 * * *"  # Runs daily at 2 AM UTC
```

Or use the Supabase Dashboard:
1. Go to Edge Functions
2. Select `cleanup-sessions`
3. Add Cron Trigger: `0 2 * * *`

## Usage

### Manual Invocation

#### Test with Dry Run (Safe)
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Execute Cleanup (Production)
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Response Format

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

## Configuration

Edit the `CONFIG` object in `index.ts`:

```typescript
const CONFIG = {
  AUTH_SESSION_EXPIRY_DAYS: 30,      // Inactive user threshold
  TEMP_FILE_EXPIRY_DAYS: 7,          // Temporary file retention
  EVENT_RSVP_CLEANUP_DAYS: 30,       // Days after event to keep RSVPs
  MODERATION_CLEANUP_DAYS: 90,       // Days to keep rejected items
  BATCH_SIZE: 100,                   // Items per batch
  DRY_RUN: false,                    // Default dry run mode
};
```

## Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs cleanup-sessions --follow

# Recent logs
supabase functions logs cleanup-sessions --tail 100
```

### Common Log Messages

- `Starting cleanup operations...` - Function started
- `Found X expired temp files in 'bucket-name'` - Files detected
- `Deleted X items from Y` - Successful deletion
- `[DRY RUN] Would delete X items` - Dry run simulation
- `Error in cleanupXXX:` - Operation error (logged but continues)

## Troubleshooting

### Function Fails with "Missing required environment variables"

**Solution**: Set environment variables in Supabase Dashboard
```bash
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Storage Bucket Not Found

**Solution**: Ensure buckets exist in Supabase Storage
- Check bucket names in the function code match your setup
- Create missing buckets or remove them from the `buckets` array

### Timeout Errors

**Solution**: Reduce `BATCH_SIZE` in CONFIG
```typescript
BATCH_SIZE: 50,  // Reduce from 100
```

### No Items Cleaned Up

**Possible Reasons**:
- Safety check is active (use `?force=true`)
- No items meet cleanup criteria
- Dry run mode is enabled

## Security Considerations

- Function uses service role key (full database access)
- No JWT verification required (runs as system task)
- Should only be triggered by cron or authorized API calls
- Consider adding IP allowlist in production
- Audit logs are generated for all deletions

## Best Practices

1. **Always test with dry_run=true first**
2. **Monitor logs after deployment**
3. **Adjust retention periods based on your needs**
4. **Back up data before running in production**
5. **Review inactive user list manually before deletion**
6. **Set up alerts for cleanup failures**

## Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Cron Triggers](https://supabase.com/docs/guides/functions/schedule-functions)

## Support

For issues or questions:
1. Check function logs: `supabase functions logs cleanup-sessions`
2. Review error messages in the response JSON
3. Verify environment variables are set correctly
4. Test with dry_run mode to diagnose issues
