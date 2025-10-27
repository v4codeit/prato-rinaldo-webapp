# Deployment Guide: Aggregate Stats Edge Function

Complete step-by-step guide for deploying the aggregate-stats Edge Function to Supabase.

## Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** set up and linked:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Database access** with service role key

## Step 1: Apply Database Migration

First, create the `aggregated_stats` table:

```bash
# From project root
supabase db push
```

Or apply the migration manually:

```bash
# Copy the SQL from migrations/00005_aggregated_stats_table.sql
# and run it in Supabase Dashboard > SQL Editor
```

Verify the table was created:

```sql
SELECT * FROM aggregated_stats LIMIT 1;
```

## Step 2: Deploy the Edge Function

Deploy the function to Supabase:

```bash
# From project root
supabase functions deploy aggregate-stats
```

You should see output like:

```
Deploying aggregate-stats (project ref: your-project-ref)
Bundled aggregate-stats (0.5MB)
Deployed aggregate-stats
  https://your-project-ref.supabase.co/functions/v1/aggregate-stats
```

## Step 3: Set Environment Variables

The function needs these environment variables:

```bash
# Set Supabase URL
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co

# Set service role key (find this in Supabase Dashboard > Settings > API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Verify secrets are set:

```bash
supabase secrets list
```

## Step 4: Configure Cron Schedule

### Option A: Using CLI (Recommended)

The `.cron.yaml` file should be automatically deployed with the function. Verify it:

```bash
# View current cron jobs
supabase functions list
```

### Option B: Using Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** > **aggregate-stats**
3. Click on **Cron jobs** tab
4. Add a new cron job:
   - **Schedule**: `0 */6 * * *` (every 6 hours)
   - **Function**: aggregate-stats
   - **Enabled**: Yes

## Step 5: Test the Function

Run the function manually to test:

```bash
# Invoke the function
supabase functions invoke aggregate-stats
```

Expected output:

```json
{
  "success": true,
  "message": "Successfully calculated stats for 1 tenant(s)",
  "results": [
    {
      "tenant_id": "...",
      "tenant_name": "Prato Rinaldo",
      "stats": [
        {
          "stat_key": "total_users",
          "stat_value": 150,
          "metadata": { "category": "users" }
        },
        ...
      ],
      "calculated_at": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

## Step 6: Verify Data in Database

Check that stats were written to the database:

```sql
SELECT
  stat_key,
  stat_value,
  metadata,
  updated_at
FROM aggregated_stats
ORDER BY updated_at DESC
LIMIT 20;
```

## Step 7: Monitor Function Logs

Check function logs for any errors:

```bash
# View recent logs
supabase functions logs aggregate-stats

# Tail logs in real-time
supabase functions logs aggregate-stats --tail
```

## Step 8: Integrate with Admin Dashboard

Add the stats endpoint to your tRPC router:

1. **Copy the example router** from `example-trpc-router.ts`
2. **Add to your admin router** or create a new stats router
3. **Update the main router** to include the stats router

Example integration:

```typescript
// In server/routers/_app.ts or main router
import { statsRouter } from './stats';

export const appRouter = router({
  // ... existing routers
  stats: statsRouter,
});
```

## Step 9: Use Stats in Frontend

```typescript
// In your Admin Dashboard component
import { trpc } from '@/lib/trpc';

export function AdminDashboard() {
  const { data: stats, isLoading } = trpc.stats.getDashboardOverview.useQuery();

  if (isLoading) return <div>Loading stats...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={stats?.users.total}
        subtitle={`${stats?.users.verified} verified`}
      />
      <StatCard
        title="Events This Month"
        value={stats?.events.thisMonth}
        subtitle={`${stats?.events.total} total events`}
      />
      <StatCard
        title="Marketplace Items"
        value={stats?.marketplace.active}
        subtitle={`${stats?.marketplace.sold} sold`}
      />
      <StatCard
        title="Forum Activity"
        value={stats?.forum.threads}
        subtitle={`${stats?.forum.posts} posts`}
      />
    </div>
  );
}
```

## Troubleshooting

### Function Times Out

If you have many tenants or large datasets:

1. **Increase timeout** (max 300 seconds for Edge Functions):
   ```bash
   # In function metadata or dashboard settings
   timeout: 300
   ```

2. **Optimize queries** by adding indexes:
   ```sql
   CREATE INDEX CONCURRENTLY idx_users_tenant_status
   ON users(tenant_id, verification_status);
   ```

3. **Process tenants in batches** (modify the function)

### Stats Not Updating

1. **Check cron is enabled**:
   ```bash
   supabase functions list
   ```

2. **Verify cron schedule**:
   - Dashboard > Edge Functions > aggregate-stats > Cron jobs

3. **Check function logs**:
   ```bash
   supabase functions logs aggregate-stats --tail
   ```

4. **Manually trigger**:
   ```bash
   supabase functions invoke aggregate-stats
   ```

### Missing Statistics

If certain stats are always 0:

1. **Verify table exists**:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_name = 'marketplace_items'
   );
   ```

2. **Check RLS policies** allow service role access

3. **Review function logs** for specific errors

### Permission Errors

If you get "permission denied" errors:

1. **Verify service role key** is correct:
   ```bash
   supabase secrets list
   ```

2. **Check RLS policies** on aggregated_stats table:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'aggregated_stats';
   ```

3. **Ensure service role policy exists**:
   ```sql
   -- Should have a policy for service role
   CREATE POLICY "Service role can manage stats" ON aggregated_stats
     FOR ALL
     USING (true)
     WITH CHECK (true);
   ```

## Performance Optimization

### Reduce Execution Time

1. **Add database indexes** on frequently queried columns:
   ```sql
   CREATE INDEX idx_events_tenant_date ON events(tenant_id, start_date);
   CREATE INDEX idx_marketplace_tenant_sold ON marketplace_items(tenant_id, is_sold);
   CREATE INDEX idx_forum_threads_tenant ON forum_threads(tenant_id);
   ```

2. **Use COUNT(*) instead of COUNT(column)**

3. **Batch related queries** using Promise.all()

### Reduce Function Invocations

1. **Adjust cron frequency** based on needs:
   ```yaml
   # Less frequent = lower cost
   schedule: "0 0 * * *"  # Daily at midnight
   ```

2. **Use incremental updates** for frequently changing stats

## Monitoring & Alerts

### Set up monitoring

1. **Dashboard**: Check function metrics in Supabase Dashboard

2. **Logs**: Regularly review logs for errors:
   ```bash
   supabase functions logs aggregate-stats --since 1h
   ```

3. **Alerts**: Set up alerts in Dashboard for:
   - Function errors
   - High execution time
   - Failed invocations

### Health Check

Create a simple health check endpoint:

```typescript
// Add to your API
app.get('/api/health/stats', async (req, res) => {
  const lastUpdate = await db
    .select({ updated_at: aggregatedStats.updatedAt })
    .from(aggregatedStats)
    .orderBy(desc(aggregatedStats.updatedAt))
    .limit(1);

  const hoursSinceUpdate = lastUpdate[0]
    ? (Date.now() - lastUpdate[0].updated_at.getTime()) / (1000 * 60 * 60)
    : null;

  res.json({
    healthy: hoursSinceUpdate !== null && hoursSinceUpdate < 7,
    last_update: lastUpdate[0]?.updated_at,
    hours_since_update: hoursSinceUpdate,
  });
});
```

## Cost Optimization

Edge Functions pricing:

- **Free tier**: 500K requests/month, 400K GB-s compute
- **Paid tier**: $2 per 1M requests, $0.00002 per GB-s

For this function running every 6 hours:

- **Invocations/month**: ~120 (4/day × 30 days)
- **Estimated cost**: Nearly free (well within free tier)

To reduce costs further:

1. Run less frequently (daily instead of every 6 hours)
2. Only calculate stats that changed (incremental updates)
3. Cache results in CDN for public stats

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use RLS policies** on aggregated_stats table
3. **Validate input** if function accepts parameters
4. **Rate limit** manual invocations if public
5. **Monitor logs** for suspicious activity

## Next Steps

1. Add more statistics as needed
2. Create historical tracking (time-series data)
3. Set up webhooks for real-time notifications
4. Add custom stat definitions via configuration
5. Implement per-tenant scheduling options

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Edge Functions Reference**: https://supabase.com/docs/reference/cli/supabase-functions
- **Community**: https://github.com/supabase/supabase/discussions
