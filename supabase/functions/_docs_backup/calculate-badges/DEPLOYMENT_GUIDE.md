# Calculate Badges - Complete Deployment Guide

This guide walks you through deploying the `calculate-badges` Supabase Edge Function for the Prato Rinaldo platform.

## Overview

The `calculate-badges` function automatically awards badges to users based on their activities and achievements. It runs on a schedule (hourly by default) and processes all verified users.

## Prerequisites

Before deploying, ensure you have:

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Supabase project** set up and linked
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Database access** with permissions to create extensions and cron jobs

## Deployment Steps

### Step 1: Database Schema Updates

First, add the required `slug` and `category` columns to the `badges` table:

```bash
# Run the migration in your Supabase SQL Editor
cat migration-add-badge-slug.sql
```

Or run it via Supabase CLI:
```bash
supabase db execute --file migration-add-badge-slug.sql
```

**What this does:**
- Adds `slug` column to badges table (VARCHAR 100)
- Adds `category` column to badges table (VARCHAR 100)
- Creates unique index on `tenant_id + slug`
- Creates index on `category`

### Step 2: Seed Badges

Create the required badges in your database:

```bash
# First, get your tenant_id
supabase db execute --query "SELECT id, name FROM tenants LIMIT 1;"

# Edit seed-badges.sql and replace YOUR_TENANT_ID with your actual tenant ID
# Then run:
supabase db execute --file seed-badges.sql
```

**What this does:**
- Creates 6 badges: Benvenuto, Primo Post, Partecipante Attivo, Venditore, Volontario, Contributore
- Uses UPSERT logic, so it's safe to run multiple times

### Step 3: Deploy the Edge Function

Deploy the function to Supabase:

```bash
supabase functions deploy calculate-badges
```

Or use the deployment script:
```bash
./deploy.sh production
```

**What this does:**
- Uploads the function code to Supabase
- Configures environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are automatic)
- Makes the function available at: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges`

### Step 4: Set Up Cron Job

Schedule the function to run automatically every hour:

```bash
# Edit setup-cron.sql:
# 1. Replace YOUR_PROJECT_REF with your project reference
# 2. Replace YOUR_ANON_KEY with your anon key (from Supabase dashboard)
# Then run:
supabase db execute --file setup-cron.sql
```

**What this does:**
- Enables `pg_cron` and `pg_net` extensions
- Creates a cron job named `calculate-badges-hourly`
- Schedules it to run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)

### Step 5: Verify Deployment

Test the function manually:

```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

Check the logs:
```bash
supabase functions logs calculate-badges --follow
```

Verify the cron job:
```sql
SELECT * FROM cron.job WHERE jobname = 'calculate-badges-hourly';
```

## Quick Start (All Steps)

If you prefer to run all steps at once:

```bash
# 1. Navigate to the function directory
cd supabase/functions/calculate-badges

# 2. Run database migrations and seeds
supabase db execute --file migration-add-badge-slug.sql
# Edit seed-badges.sql first to add your tenant_id
supabase db execute --file seed-badges.sql

# 3. Deploy the function
supabase functions deploy calculate-badges

# 4. Set up cron job
# Edit setup-cron.sql first to add your project ref and anon key
supabase db execute --file setup-cron.sql

# 5. Test it
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Local Testing

Before deploying to production, test locally:

```bash
# 1. Start local Supabase
supabase start

# 2. Run migrations locally
supabase db execute --file migration-add-badge-slug.sql --local
supabase db execute --file seed-badges.sql --local

# 3. Serve function locally
supabase functions serve calculate-badges --no-verify-jwt

# 4. Test it (in another terminal)
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
  --header 'Content-Type: application/json'
```

Or use the test script:
```bash
./test-local.sh
```

## Environment Variables

The function automatically receives these environment variables from Supabase:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

**Note:** Service role key is automatically provided - you don't need to set it manually.

## Monitoring

### View Function Logs

```bash
# Stream logs in real-time
supabase functions logs calculate-badges --follow

# View recent logs
supabase functions logs calculate-badges --limit 100
```

### Monitor Cron Job Execution

```sql
-- View recent cron job runs
SELECT
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname = 'calculate-badges-hourly'
)
ORDER BY start_time DESC
LIMIT 20;
```

### Check Function Performance

```sql
-- Count total badges awarded
SELECT COUNT(*) as total_badges_awarded FROM user_badges;

-- Count badges awarded in last 24 hours
SELECT COUNT(*) as recent_awards
FROM user_badges
WHERE earned_at > NOW() - INTERVAL '24 hours';

-- Badges awarded by type
SELECT
  b.name,
  b.slug,
  COUNT(*) as awards_count
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.id, b.name, b.slug
ORDER BY awards_count DESC;
```

## Troubleshooting

### Function Not Running

**Symptom:** Cron job exists but function doesn't run

**Solutions:**
1. Check if cron job is active:
   ```sql
   SELECT jobname, active FROM cron.job WHERE jobname = 'calculate-badges-hourly';
   ```

2. Enable it if disabled:
   ```sql
   UPDATE cron.job SET active = true WHERE jobname = 'calculate-badges-hourly';
   ```

3. Check cron job logs for errors:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'calculate-badges-hourly')
   ORDER BY start_time DESC LIMIT 5;
   ```

### Badges Not Being Awarded

**Symptom:** Function runs but no badges are awarded

**Solutions:**
1. Check function logs:
   ```bash
   supabase functions logs calculate-badges --limit 50
   ```

2. Verify badges exist:
   ```sql
   SELECT * FROM badges ORDER BY points;
   ```

3. Check if users are verified:
   ```sql
   SELECT COUNT(*) FROM users WHERE verification_status = 'approved';
   ```

4. Manually test criteria:
   ```sql
   -- Test onboarding completion
   SELECT COUNT(*) FROM users WHERE onboarding_completed = true;

   -- Test forum posts
   SELECT author_id, COUNT(*) FROM forum_posts GROUP BY author_id;

   -- Test event RSVPs
   SELECT user_id, COUNT(*) FROM event_rsvps WHERE status = 'going' GROUP BY user_id;
   ```

### Permission Errors

**Symptom:** Function fails with permission errors

**Solutions:**
1. Ensure service role key is being used (automatic in Supabase)
2. Check RLS policies aren't blocking the function
3. Verify extensions are enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

### Performance Issues

**Symptom:** Function takes too long to run

**Solutions:**
1. Add database indexes:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
   CREATE INDEX IF NOT EXISTS idx_forum_posts_author_status ON forum_posts(author_id, status);
   CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_status ON event_rsvps(user_id, status);
   CREATE INDEX IF NOT EXISTS idx_marketplace_seller_status ON marketplace_items(seller_id, status);
   ```

2. Reduce execution frequency (e.g., every 6 hours instead of hourly):
   ```sql
   SELECT cron.schedule(
     'calculate-badges-6hours',
     '0 */6 * * *',
     $$ ... $$
   );
   ```

3. Process users in batches (modify function code to add LIMIT/OFFSET)

## Maintenance

### Temporarily Disable Cron Job

```sql
UPDATE cron.job SET active = false WHERE jobname = 'calculate-badges-hourly';
```

### Re-enable Cron Job

```sql
UPDATE cron.job SET active = true WHERE jobname = 'calculate-badges-hourly';
```

### Delete Cron Job

```sql
SELECT cron.unschedule('calculate-badges-hourly');
```

### Update Function Code

```bash
# Make changes to index.ts
# Then redeploy
supabase functions deploy calculate-badges

# The cron job will automatically use the new version
```

### Add New Badge Type

1. Add badge to database:
   ```sql
   INSERT INTO badges (tenant_id, name, slug, description, icon, points, category)
   VALUES ('YOUR_TENANT_ID', 'New Badge', 'new-badge', 'Description', 'icon-name', 50, 'category');
   ```

2. Update function code in `index.ts`:
   ```typescript
   'new-badge': {
     name: 'New Badge',
     slug: 'new-badge',
     description: 'Description',
     points: 50,
     icon: 'icon-name',
     checkCriteria: async (supabase, userId, tenantId) => {
       // Your logic here
       return true;
     },
   }
   ```

3. Redeploy function:
   ```bash
   supabase functions deploy calculate-badges
   ```

## Security Considerations

- **Service Role Key:** Function uses service role key which bypasses RLS. This is necessary for system-level operations.
- **User Verification:** Only processes users with `verification_status = 'approved'`
- **Idempotent:** Safe to run multiple times - won't award duplicate badges
- **No User Input:** Function doesn't accept user input, reducing attack surface
- **CORS Headers:** Configured but function is designed for cron execution, not client calls

## Support

For issues or questions:
1. Check the logs: `supabase functions logs calculate-badges`
2. Review this guide's Troubleshooting section
3. Check Supabase documentation: https://supabase.com/docs/guides/functions
4. Review the README.md for technical details

## Version History

- **v1.0.0** - Initial release with 6 badge types
  - Benvenuto (10 pts)
  - Primo Post (20 pts)
  - Venditore (30 pts)
  - Partecipante Attivo (50 pts)
  - Contributore (75 pts)
  - Volontario (100 pts)
