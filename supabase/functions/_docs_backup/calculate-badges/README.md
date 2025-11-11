# Calculate Badges - Supabase Edge Function

## Overview

This Edge Function automatically calculates and awards badges to users based on their activities and achievements in the Prato Rinaldo platform.

## Features

- **Automatic Badge Detection**: Scans all verified users and checks if they meet badge criteria
- **Multiple Badge Types**: Supports 6 different badge types with various point values
- **Idempotent**: Won't award the same badge twice to a user
- **Error Handling**: Comprehensive error handling and logging
- **Scheduled Execution**: Designed to run hourly via Cron

## Badge Types

| Badge | Slug | Points | Criteria |
|-------|------|--------|----------|
| Benvenuto | `benvenuto` | 10 | User completed onboarding |
| Primo Post | `primo-post` | 20 | User created first forum post (approved) |
| Partecipante Attivo | `partecipante-attivo` | 50 | User attended 5+ events (RSVP status: going) |
| Venditore | `venditore` | 30 | User sold at least one marketplace item |
| Volontario | `volontario` | 100 | User offered volunteer services |
| Contributore | `contributore` | 75 | User donated to committee via marketplace |

## Environment Variables

The function requires the following environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key with admin privileges

These are automatically provided by Supabase when deploying edge functions.

## Deployment

### 1. Deploy the function

```bash
supabase functions deploy calculate-badges
```

### 2. Set up Cron trigger (hourly execution)

```bash
# Using Supabase Dashboard:
# 1. Go to Database > Cron Jobs
# 2. Create new job with schedule: 0 * * * *
# 3. Command: SELECT net.http_post(
#      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
#      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
#      body:='{}'::jsonb
#    );
```

Or using SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'calculate-badges-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### 3. Manual execution (testing)

```bash
# Local testing
supabase functions serve calculate-badges

# In another terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'

# Production testing
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Processed 45 users, awarded 12 badges",
  "data": {
    "totalProcessed": 45,
    "badgesAwarded": 12,
    "errors": 0,
    "details": [
      {
        "userId": "uuid-here",
        "userName": "Mario Rossi",
        "badgeName": "Benvenuto",
        "badgeSlug": "benvenuto",
        "points": 10,
        "success": true
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Database Schema Requirements

The function requires the following tables:

- `users` - User profiles with onboarding status
- `badges` - Badge definitions
- `user_badges` - Junction table for awarded badges
- `forum_posts` - Forum posts for "Primo Post" badge
- `event_rsvps` - Event RSVPs for "Partecipante Attivo" badge
- `marketplace_items` - Marketplace items for "Venditore" and "Contributore" badges
- `professional_profiles` - Professional profiles for "Volontario" badge

## Monitoring

View function logs:

```bash
# Stream logs in real-time
supabase functions logs calculate-badges --follow

# View recent logs
supabase functions logs calculate-badges
```

## Performance Considerations

- **Batch Processing**: Processes all users in a single execution
- **Progress Logging**: Logs progress every 10 users
- **Idempotent**: Safe to run multiple times without duplicating badges
- **Query Optimization**: Uses `count` queries with `head: true` for efficiency
- **Error Isolation**: Errors in one user's processing won't affect others

## Testing

Before deploying to production, ensure:

1. All required badges exist in the `badges` table with correct slugs
2. Test with a small subset of users first
3. Monitor logs for any errors
4. Verify badge awards are correct in the database

## Extending Badge Logic

To add a new badge:

1. Add badge definition to `BADGE_DEFINITIONS` object
2. Implement the `checkCriteria` function
3. Add corresponding badge record to `badges` table
4. Deploy updated function

Example:

```typescript
'new-badge': {
  name: 'New Badge',
  slug: 'new-badge',
  description: 'Description of new badge',
  points: 25,
  icon: 'icon-name',
  checkCriteria: async (supabase: any, userId: string, tenantId: string) => {
    // Your custom logic here
    return true; // or false
  },
}
```

## Troubleshooting

### Function not running on schedule

- Verify Cron job is active: `SELECT * FROM cron.job;`
- Check Cron job logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Badges not being awarded

- Check function logs for errors
- Verify badge exists in database with correct slug
- Ensure users meet the criteria
- Check user verification status (must be 'approved')

### Performance issues

- Consider adding indexes to frequently queried columns
- Reduce processing frequency if needed
- Implement batch size limits for very large user bases

## Security

- Uses **service role key** for database access (bypasses RLS)
- Only processes verified users (`verification_status = 'approved'`)
- No user input required (runs automatically)
- CORS headers configured for security

## License

Part of the Prato Rinaldo WebApp project.
