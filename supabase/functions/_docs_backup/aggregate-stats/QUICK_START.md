# Quick Start: Aggregate Stats Edge Function

Get up and running in 5 minutes.

## What This Does

Pre-calculates dashboard statistics every 6 hours and stores them in the `aggregated_stats` table for instant admin dashboard display.

## Files Created

```
supabase/
├── functions/
│   ├── aggregate-stats/
│   │   ├── index.ts                      # Edge Function (500+ lines)
│   │   ├── deno.json                     # Dependencies
│   │   ├── README.md                     # Full documentation
│   │   ├── DEPLOYMENT_GUIDE.md           # Detailed deployment steps
│   │   ├── example-trpc-router.ts        # tRPC integration example
│   │   └── drizzle-schema-snippet.ts     # ORM schema
│   └── .cron.yaml                        # Cron: every 6 hours
└── migrations/
    └── 00005_aggregated_stats_table.sql  # Database table
```

## 5-Minute Deployment

### 1. Apply Migration (30 seconds)

```bash
cd D:\develop\pratorinaldo-next
supabase db push
```

### 2. Deploy Function (1 minute)

```bash
supabase functions deploy aggregate-stats
```

### 3. Set Environment Variables (1 minute)

```bash
# Get your service role key from: Dashboard > Settings > API
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhb...your-key
```

### 4. Test It (30 seconds)

```bash
supabase functions invoke aggregate-stats
```

Expected output:
```json
{
  "success": true,
  "message": "Successfully calculated stats for 1 tenant(s)",
  "results": [...]
}
```

### 5. Verify in Database (30 seconds)

```sql
SELECT stat_key, stat_value, updated_at
FROM aggregated_stats
ORDER BY updated_at DESC
LIMIT 10;
```

You should see stats like:
- `total_users`
- `verified_users`
- `events_this_month`
- `marketplace_items_total`
- etc.

## Statistics Available

**20+ statistics across 8 categories:**

- **Users**: total, verified, pending, by membership type
- **Events**: total, this month, published, RSVPs
- **Marketplace**: total, sold, active items
- **Forum**: threads, posts, categories
- **Articles**: total, published
- **Professionals**: total, approved
- **Moderation**: pending items
- **Gamification**: badges awarded

## Using Stats in Your App

### Option 1: Add tRPC Router (Recommended)

Copy `example-trpc-router.ts` to your server/routers/ directory:

```typescript
// Usage in React component
const { data: stats } = trpc.stats.getDashboardOverview.useQuery();

<div>
  <h3>Total Users: {stats?.users.total}</h3>
  <h3>Events This Month: {stats?.events.thisMonth}</h3>
</div>
```

### Option 2: Direct Supabase Query

```typescript
const { data: stats } = await supabase
  .from('aggregated_stats')
  .select('*')
  .eq('tenant_id', tenantId);

const totalUsers = stats?.find(s => s.stat_key === 'total_users')?.stat_value;
```

## Automatic Updates

Function runs automatically **every 6 hours**:
- 00:00 (midnight)
- 06:00 (6am)
- 12:00 (noon)
- 18:00 (6pm)

To change frequency, edit `.cron.yaml`:

```yaml
schedule: "0 * * * *"     # Every hour
schedule: "0 */2 * * *"   # Every 2 hours
schedule: "0 0 * * *"     # Daily at midnight
```

## Manual Trigger

Force recalculation anytime:

```bash
supabase functions invoke aggregate-stats
```

Or from your app (admin only):

```typescript
const triggerRecalc = trpc.stats.triggerStatsRecalculation.useMutation();
await triggerRecalc.mutateAsync();
```

## Monitoring

### View Logs

```bash
# Recent logs
supabase functions logs aggregate-stats

# Live tail
supabase functions logs aggregate-stats --tail
```

### Check Health

```sql
-- How old are the stats?
SELECT
  MAX(updated_at) as last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 as hours_ago
FROM aggregated_stats;
```

If `hours_ago` > 7, something might be wrong.

## Troubleshooting

### Stats Not Updating

```bash
# 1. Check cron is configured
supabase functions list

# 2. Check logs for errors
supabase functions logs aggregate-stats

# 3. Manually trigger
supabase functions invoke aggregate-stats
```

### Function Fails

Check environment variables:

```bash
supabase secrets list
```

Should show:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Permission Errors

Verify RLS policy exists:

```sql
SELECT * FROM pg_policies
WHERE tablename = 'aggregated_stats'
AND policyname = 'Service role can manage stats';
```

## Performance

- **Execution time**: 2-5 seconds per tenant
- **Cost**: Nearly free (well within Supabase free tier)
- **Freshness**: Stats can be up to 6 hours old

To improve:

1. **Add indexes** on heavily queried tables
2. **Reduce frequency** if stats don't change often
3. **Incremental updates** (future enhancement)

## Security

- Service role key has full database access
- Never expose it in client-side code
- RLS policies protect aggregated_stats table
- Only admins can read stats for their tenant

## Next Steps

1. ✅ Deploy and test (you just did this!)
2. Add tRPC router to your app
3. Update admin dashboard to use stats
4. Set up monitoring/alerts
5. Customize stats as needed

## Need Help?

- **Full documentation**: See `README.md`
- **Detailed deployment**: See `DEPLOYMENT_GUIDE.md`
- **File reference**: See `FILES.md`
- **Supabase docs**: https://supabase.com/docs/guides/functions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Function                    │
│                     (aggregate-stats)                        │
│                                                              │
│  Triggered by Cron: 0 */6 * * * (every 6 hours)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Calculate Stats for All Tenants                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Count Users  │  │ Count Events │  │ Count Forum  │      │
│  │ - Total      │  │ - Total      │  │ - Threads    │      │
│  │ - Verified   │  │ - This month │  │ - Posts      │      │
│  │ - Pending    │  │ - Published  │  │ - Categories │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Marketplace  │  │ Articles     │  │ Professionals│      │
│  │ - Total      │  │ - Total      │  │ - Total      │      │
│  │ - Sold       │  │ - Published  │  │ - Approved   │      │
│  │ - Active     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  UPSERT into Database                        │
│                                                              │
│  aggregated_stats table:                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ tenant_id | stat_key         | stat_value | meta  │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ uuid-123  | total_users      | 150        | {...} │     │
│  │ uuid-123  | verified_users   | 120        | {...} │     │
│  │ uuid-123  | events_this_month| 8          | {...} │     │
│  │ uuid-123  | marketplace_sold | 45         | {...} │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│                                                              │
│  trpc.stats.getDashboardOverview()                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │  📊 Dashboard Statistics                          │       │
│  │                                                   │       │
│  │  👥 Users: 150 (120 verified)                    │       │
│  │  📅 Events This Month: 8                         │       │
│  │  🛒 Marketplace: 45 sold, 23 active              │       │
│  │  💬 Forum: 234 threads, 1,567 posts              │       │
│  │                                                   │       │
│  │  Last updated: 2 hours ago                       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ⚡ Instant display - no slow database queries!             │
└─────────────────────────────────────────────────────────────┘
```

## Sample Output

When you run `supabase functions invoke aggregate-stats`:

```json
{
  "success": true,
  "message": "Successfully calculated stats for 1 tenant(s)",
  "results": [
    {
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_name": "Prato Rinaldo",
      "stats": [
        {
          "stat_key": "total_users",
          "stat_value": 150,
          "metadata": { "category": "users" }
        },
        {
          "stat_key": "verified_users",
          "stat_value": 120,
          "metadata": { "category": "users", "verification_status": "approved" }
        },
        {
          "stat_key": "events_this_month",
          "stat_value": 8,
          "metadata": {
            "category": "events",
            "period": "month",
            "start_date": "2025-10-01T00:00:00.000Z",
            "end_date": "2025-11-01T00:00:00.000Z"
          }
        },
        {
          "stat_key": "marketplace_items_sold",
          "stat_value": 45,
          "metadata": { "category": "marketplace", "is_sold": true }
        }
        // ... 16+ more stats
      ],
      "calculated_at": "2025-10-26T21:40:00.000Z"
    }
  ]
}
```

---

**That's it! You now have a production-ready stats aggregation system.**

For more details, see the other documentation files in this directory.
