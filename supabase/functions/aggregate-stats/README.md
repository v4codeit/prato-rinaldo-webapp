# Aggregate Stats Edge Function

This Supabase Edge Function pre-calculates dashboard statistics for performance optimization.

## Overview

Instead of calculating statistics on-demand (which can be slow with large datasets), this function runs periodically to pre-calculate and cache statistics in the `aggregated_stats` table. The Admin Dashboard then reads from this table for instant display.

## Deployment

### Deploy the Edge Function

```bash
# Deploy to Supabase
supabase functions deploy aggregate-stats

# Set environment variables (if not already set)
supabase secrets set SUPABASE_URL=your-project-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Configure Cron Schedule

Add this to your `supabase/functions/.cron.yaml`:

```yaml
- name: "aggregate-stats"
  function: "aggregate-stats"
  schedule: "0 */6 * * *"  # Every 6 hours
```

Or configure via Supabase Dashboard:
1. Go to Edge Functions > aggregate-stats
2. Navigate to "Cron jobs" tab
3. Set schedule: `0 */6 * * *` (every 6 hours)

## Manual Invocation

You can manually trigger the function:

```bash
# Using Supabase CLI
supabase functions invoke aggregate-stats

# Using curl
curl -X POST https://your-project-ref.supabase.co/functions/v1/aggregate-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Statistics Calculated

### User Statistics
- `total_users` - Total number of users
- `verified_users` - Users with approved verification
- `pending_verification_users` - Users awaiting verification
- `users_resident` - Users with resident membership
- `users_domiciled` - Users with domiciled membership
- `users_landowner` - Users with landowner membership

### Event Statistics
- `events_total` - Total events
- `events_this_month` - Events in current month
- `events_published` - Published events
- `event_rsvps_total` - Total event RSVPs

### Marketplace Statistics
- `marketplace_items_total` - Total marketplace items
- `marketplace_items_sold` - Sold items
- `marketplace_items_active` - Active items (approved, not sold)

### Forum Statistics
- `forum_threads_total` - Total forum threads
- `forum_posts_total` - Total forum posts
- `forum_categories_total` - Total forum categories

### Article Statistics
- `articles_total` - Total articles
- `articles_published` - Published articles

### Professional Profiles Statistics
- `professional_profiles_total` - Total professional profiles
- `professional_profiles_approved` - Approved profiles

### Moderation Statistics
- `moderation_pending` - Items awaiting moderation

### Gamification Statistics
- `badges_awarded_total` - Total badges awarded

## Database Schema

The function writes to the `aggregated_stats` table:

```sql
CREATE TABLE aggregated_stats (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  stat_key TEXT NOT NULL,
  stat_value BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, stat_key)
);
```

## Reading Stats in Your App

### Using tRPC (Recommended)

```typescript
// In your admin router
export const getAggregatedStats = protectedProcedure
  .query(async ({ ctx }) => {
    const stats = await ctx.db
      .select()
      .from(aggregatedStats)
      .where(eq(aggregatedStats.tenantId, ctx.user.tenantId));

    return stats.reduce((acc, stat) => {
      acc[stat.stat_key] = {
        value: stat.stat_value,
        metadata: stat.metadata,
        updated_at: stat.updated_at,
      };
      return acc;
    }, {} as Record<string, any>);
  });
```

### Using Supabase Client

```typescript
const { data: stats } = await supabase
  .from('aggregated_stats')
  .select('*')
  .eq('tenant_id', tenantId);

const statsMap = stats.reduce((acc, stat) => {
  acc[stat.stat_key] = stat.stat_value;
  return acc;
}, {});
```

## Performance Considerations

- **Execution Time**: Function runs for ~2-5 seconds per tenant
- **Frequency**: Runs every 6 hours by default
- **Scalability**: Processes all tenants sequentially
- **Caching**: Results are cached in `aggregated_stats` table
- **Freshness**: Stats can be up to 6 hours old

### Customizing Frequency

For higher frequency updates (at cost of more function invocations):

```yaml
# Every hour
schedule: "0 * * * *"

# Every 2 hours
schedule: "0 */2 * * *"

# Daily at midnight
schedule: "0 0 * * *"
```

## Monitoring

Check function logs:

```bash
supabase functions logs aggregate-stats
```

Or in Supabase Dashboard:
1. Go to Edge Functions
2. Click on "aggregate-stats"
3. Navigate to "Logs" tab

## Troubleshooting

### Stats Not Updating

1. Check cron job is configured:
   ```bash
   supabase functions list
   ```

2. Check function logs for errors:
   ```bash
   supabase functions logs aggregate-stats --tail
   ```

3. Manually invoke to test:
   ```bash
   supabase functions invoke aggregate-stats
   ```

### Missing Statistics

The function gracefully handles missing tables or errors. If a statistic is missing:
- Check the table exists in your database
- Check RLS policies allow service role access
- Review function logs for specific errors

### Performance Issues

If the function times out with many tenants:
- Consider reducing the number of stats calculated
- Increase function timeout (max 300s for Edge Functions)
- Process tenants in batches
- Run more frequently with incremental updates

## Security

- Uses service role key (bypasses RLS) for data access
- RLS policies on `aggregated_stats` restrict admin access
- Function is publicly invocable but idempotent
- Consider adding custom authentication if needed

## Future Enhancements

- [ ] Add incremental updates (only changed stats)
- [ ] Add webhook notifications when stats are updated
- [ ] Add historical tracking (time-series data)
- [ ] Add custom stat definitions via configuration
- [ ] Add per-tenant scheduling options
