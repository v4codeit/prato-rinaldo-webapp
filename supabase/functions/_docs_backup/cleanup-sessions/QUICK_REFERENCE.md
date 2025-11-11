# Cleanup Sessions - Quick Reference

## Quick Start

### Deploy
```bash
cd supabase/functions/cleanup-sessions
./deploy.sh
```

### Test
```bash
# Dry run (safe)
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Real execution
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/cleanup-sessions?force=true' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Monitor
```bash
supabase functions logs cleanup-sessions --follow
```

## Cleanup Operations

| Operation | Retention | Target | Action |
|-----------|-----------|--------|--------|
| Auth Sessions | 30 days | Inactive users | Log only (manual review) |
| Temp Files | 7 days | Storage buckets (temp/) | Delete files |
| Event RSVPs | 30 days after event | event_rsvps table | Delete records |
| Moderation Queue | 90 days | Rejected items only | Delete records |

## Configuration

### Location: `index.ts`
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

### Schedule: `supabase/config.toml`
```toml
[functions.cleanup-sessions.schedule]
cron = "0 2 * * *"  # Daily at 2 AM UTC
```

## API Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dry_run` | boolean | false | Test mode - no deletions |
| `force` | boolean | false | Bypass safety check |

## Response Format

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
    "endTime": "2025-10-26T02:00:15.123Z",
    "durationMs": 15123
  },
  "message": "Cleanup completed successfully"
}
```

## Common Commands

### Deploy
```bash
supabase functions deploy cleanup-sessions
```

### Set Secrets
```bash
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

### View Logs
```bash
# Real-time
supabase functions logs cleanup-sessions --follow

# Last 100 lines
supabase functions logs cleanup-sessions --tail 100

# Specific time range
supabase functions logs cleanup-sessions --since 1h
```

### Test Locally (Deno)
```bash
deno run --allow-net --allow-env test.ts
```

### Delete Function
```bash
supabase functions delete cleanup-sessions
```

## Cron Schedule Examples

| Schedule | Description |
|----------|-------------|
| `0 2 * * *` | Daily at 2 AM UTC |
| `0 */6 * * *` | Every 6 hours |
| `0 2 * * 0` | Weekly on Sunday at 2 AM |
| `0 2 1 * *` | Monthly on 1st at 2 AM |

## Storage Buckets Checked

1. `avatars`
2. `articles`
3. `events`
4. `marketplace`
5. `documents`

Each bucket is checked for files in the `temp/` folder.

## Moderation Item Types

- `marketplace_item`
- `professional_profile`
- `forum_thread`
- `forum_post`
- `tutorial_request`

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing environment variables | Secrets not set | Set SUPABASE_URL and SERVICE_ROLE_KEY |
| Bucket not found | Bucket doesn't exist | Create bucket or remove from code |
| Timeout | Too many items | Reduce BATCH_SIZE |
| Permission denied | Wrong key | Use service_role key, not anon key |

### Safety Checks

1. **Environment check**: Validates required variables
2. **Parameter check**: Requires `dry_run=true` or `force=true`
3. **Batch processing**: Prevents memory overflow
4. **Error isolation**: One failure doesn't stop entire cleanup

## Monitoring Checklist

- [ ] Function deploys successfully
- [ ] Cron schedule is active
- [ ] Dry run returns expected results
- [ ] No errors in logs
- [ ] Stats show items being cleaned
- [ ] Duration is reasonable (<2 minutes)

## Troubleshooting

### No Items Cleaned

**Check:**
1. Is dry_run mode active?
2. Are there items meeting cleanup criteria?
3. Are retention periods too long?

### Function Times Out

**Solutions:**
1. Reduce BATCH_SIZE
2. Increase retention periods (fewer items)
3. Run more frequently

### Storage Errors

**Check:**
1. Do buckets exist?
2. Does service role have storage permissions?
3. Are bucket names correct?

### Database Errors

**Check:**
1. Is service role key correct?
2. Do tables exist?
3. Are there database locks?

## Best Practices

1. **Always test with dry_run first**
2. **Monitor logs after deployment**
3. **Back up before first run**
4. **Set up failure alerts**
5. **Review stats regularly**
6. **Adjust retention periods as needed**

## Files Structure

```
cleanup-sessions/
├── index.ts              # Main function code
├── deno.json            # Deno configuration
├── README.md            # User documentation
├── ARCHITECTURE.md      # Technical architecture
├── QUICK_REFERENCE.md   # This file
├── .env.example         # Environment template
├── test.ts              # Test script
└── deploy.sh            # Deployment script
```

## Environment Setup

### Local Development
```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env

# Test locally
deno run --allow-net --allow-env test.ts
```

### Production
```bash
# Set in Supabase Dashboard
Settings > Edge Functions > Secrets

# Or via CLI
supabase secrets set KEY=value
```

## Links

- [Supabase Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy)
- [Cron Syntax](https://crontab.guru/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Support

For issues:
1. Check logs first
2. Test with dry_run
3. Verify environment variables
4. Review ARCHITECTURE.md
5. Check Supabase status
