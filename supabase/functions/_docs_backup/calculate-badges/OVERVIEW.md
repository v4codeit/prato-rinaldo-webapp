# Calculate Badges - Supabase Edge Function

## Complete Implementation Overview

This directory contains a complete, production-ready Supabase Edge Function for automatic badge calculation and awarding in the Prato Rinaldo platform.

## What This Function Does

The `calculate-badges` Edge Function:

1. **Runs on a Schedule** - Executes every hour via Cron job
2. **Processes All Users** - Scans verified users for badge eligibility
3. **Awards Badges Automatically** - Grants badges when users meet criteria
4. **Prevents Duplicates** - Won't award the same badge twice
5. **Logs Everything** - Comprehensive logging for monitoring and debugging

## Badge Types Implemented

| Badge | Criteria | Points |
|-------|----------|--------|
| Benvenuto | Complete onboarding | 10 |
| Primo Post | Create first forum post | 20 |
| Venditore | Sell marketplace item | 30 |
| Partecipante Attivo | Attend 5+ events | 50 |
| Contributore | Donate via marketplace | 75 |
| Volontario | Offer volunteer services | 100 |

## Files Included

### Core Function Files

- **`index.ts`** - Main Edge Function implementation (Deno/TypeScript)
  - Complete badge awarding logic
  - Error handling and logging
  - Idempotent badge awarding
  - Support for 6 badge types
  - ~350 lines of production code

- **`deno.json`** - Deno configuration
  - TypeScript compiler options
  - Import maps for dependencies
  - Task definitions

### Database Files

- **`migration-add-badge-slug.sql`** - Database migration
  - Adds `slug` column to badges table
  - Adds `category` column to badges table
  - Creates necessary indexes
  - Safe to run on existing databases

- **`seed-badges.sql`** - Badge data seeding
  - Creates all 6 required badges
  - UPSERT logic (safe to run multiple times)
  - Italian descriptions
  - Includes category and icon assignments

- **`setup-cron.sql`** - Cron job configuration
  - Enables pg_cron and pg_net extensions
  - Creates hourly scheduled job
  - Includes monitoring queries
  - Alternative schedule examples

### Testing & Deployment

- **`deploy.sh`** - Automated deployment script
  - Deploys function to Supabase
  - Provides setup instructions
  - Includes testing commands
  - Shell script (executable)

- **`test-local.sh`** - Local testing script
  - Starts function locally
  - Tests with curl
  - Cleans up after testing
  - Shell script (executable)

- **`index.test.ts`** - Test file template
  - Deno test structure
  - Basic test cases
  - Ready for expansion

### Documentation

- **`README.md`** - Technical documentation
  - Function features and capabilities
  - API response formats
  - Badge criteria details
  - Performance considerations
  - Troubleshooting guide

- **`DEPLOYMENT_GUIDE.md`** - Step-by-step deployment
  - Complete deployment walkthrough
  - Quick start instructions
  - Local testing guide
  - Monitoring and maintenance
  - Troubleshooting section

- **`OVERVIEW.md`** - This file
  - High-level overview
  - File descriptions
  - Quick reference

### Configuration

- **`.gitignore`** - Git ignore rules
  - Environment files
  - Logs
  - OS and IDE files

## Quick Start

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Deployment (5 Steps)

```bash
# 1. Run database migration
supabase db execute --file migration-add-badge-slug.sql

# 2. Seed badges (edit file first to add tenant_id)
supabase db execute --file seed-badges.sql

# 3. Deploy function
supabase functions deploy calculate-badges

# 4. Set up cron job (edit file first with project details)
supabase db execute --file setup-cron.sql

# 5. Test it
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

Or use the automated script:
```bash
./deploy.sh production
```

## Architecture

### Function Flow

```
Cron Trigger (Every Hour)
    ↓
Initialize Supabase Client (Service Role)
    ↓
Fetch All Badges from Database
    ↓
Fetch All Verified Users
    ↓
For Each User:
    ↓
    For Each Badge:
        ↓
        Check Criteria (Query Database)
        ↓
        If Criteria Met & Badge Not Owned:
            ↓
            Award Badge
            ↓
            Log Success
    ↓
Return Summary (Total Processed, Badges Awarded, Errors)
```

### Database Queries

The function performs these queries:

1. **Load Badges** - `SELECT * FROM badges`
2. **Load Users** - `SELECT * FROM users WHERE verification_status = 'approved'`
3. **Check Onboarding** - `SELECT onboarding_completed FROM users`
4. **Check Forum Posts** - `SELECT COUNT(*) FROM forum_posts WHERE author_id = ? AND status = 'approved'`
5. **Check Event RSVPs** - `SELECT COUNT(*) FROM event_rsvps WHERE user_id = ? AND status = 'going'`
6. **Check Marketplace** - `SELECT COUNT(*) FROM marketplace_items WHERE seller_id = ? AND status = 'sold'`
7. **Check Professional** - `SELECT COUNT(*) FROM professional_profiles WHERE user_id = ? AND availability IN ('volunteer', 'both')`
8. **Check User Badge** - `SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?`
9. **Award Badge** - `INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)`

### Performance Characteristics

- **Processing Time**: ~10-50ms per user (depends on database latency)
- **Scalability**: Can handle 1000+ users per execution
- **Database Load**: Moderate (multiple queries per user)
- **Idempotent**: Safe to run multiple times
- **Error Isolation**: Errors in one user don't affect others

## Environment Variables

The function automatically receives these from Supabase:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin-level database access

**No manual configuration needed!**

## Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs calculate-badges --follow

# Recent logs
supabase functions logs calculate-badges --limit 50
```

### Check Cron Status

```sql
-- View cron job
SELECT * FROM cron.job WHERE jobname = 'calculate-badges-hourly';

-- View recent runs
SELECT * FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'calculate-badges-hourly')
ORDER BY start_time DESC LIMIT 10;
```

### Monitor Badge Awards

```sql
-- Total badges awarded
SELECT COUNT(*) FROM user_badges;

-- Badges awarded today
SELECT COUNT(*) FROM user_badges WHERE earned_at::date = CURRENT_DATE;

-- Most popular badges
SELECT b.name, COUNT(*) as count
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.name
ORDER BY count DESC;
```

## Extending the Function

### Add a New Badge

1. **Add to Database**:
   ```sql
   INSERT INTO badges (tenant_id, name, slug, description, icon, points, category)
   VALUES ('tenant_id', 'New Badge', 'new-badge', 'Description', 'icon', 25, 'category');
   ```

2. **Add to Function** (in `index.ts`):
   ```typescript
   'new-badge': {
     name: 'New Badge',
     slug: 'new-badge',
     description: 'Earned for doing something',
     points: 25,
     icon: 'icon-name',
     checkCriteria: async (supabase, userId, tenantId) => {
       // Your custom logic here
       const { count } = await supabase
         .from('your_table')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', userId);

       return count >= 1;
     },
   }
   ```

3. **Redeploy**:
   ```bash
   supabase functions deploy calculate-badges
   ```

## Security

- **Service Role Key**: Bypasses RLS for system operations
- **Verified Users Only**: Only processes approved users
- **Idempotent**: Safe from duplicate awards
- **No User Input**: Eliminates injection risks
- **CORS Protected**: Headers configured properly

## Maintenance

### Disable Temporarily
```sql
UPDATE cron.job SET active = false WHERE jobname = 'calculate-badges-hourly';
```

### Re-enable
```sql
UPDATE cron.job SET active = true WHERE jobname = 'calculate-badges-hourly';
```

### Change Schedule
```sql
-- Change to every 6 hours
SELECT cron.schedule('calculate-badges-hourly', '0 */6 * * *', $$...$$);
```

## Troubleshooting

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.

Common issues:
- **No badges awarded**: Check badge slugs match, verify user data
- **Cron not running**: Verify extensions enabled, check active status
- **Permission errors**: Ensure service role key is set (automatic)

## Version

**v1.0.0** - Initial release

## Dependencies

- **@supabase/supabase-js** v2.39.3 - Supabase client library
- **Deno** runtime - Edge function environment
- **PostgreSQL** extensions: pg_cron, pg_net

## License

Part of the Prato Rinaldo WebApp project.

## Support

- **Documentation**: See README.md and DEPLOYMENT_GUIDE.md
- **Logs**: `supabase functions logs calculate-badges`
- **Supabase Docs**: https://supabase.com/docs/guides/functions

---

**Ready to deploy?** Follow the Quick Start section or see DEPLOYMENT_GUIDE.md for detailed instructions.
