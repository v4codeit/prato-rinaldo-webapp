# Aggregate Stats Edge Function - File Structure

Complete list of files created for the aggregate-stats Edge Function.

## Directory Structure

```
supabase/
├── functions/
│   ├── aggregate-stats/
│   │   ├── index.ts                      # Main Edge Function implementation
│   │   ├── deno.json                     # Deno configuration and dependencies
│   │   ├── README.md                     # Function documentation
│   │   ├── DEPLOYMENT_GUIDE.md           # Step-by-step deployment guide
│   │   ├── FILES.md                      # This file - complete file listing
│   │   ├── deploy.sh                     # Automated deployment script
│   │   ├── test.ts                       # Test script for function
│   │   ├── example-trpc-router.ts        # Example tRPC integration
│   │   └── drizzle-schema-snippet.ts     # Drizzle ORM schema snippet
│   └── .cron.yaml                        # Cron schedule configuration
└── migrations/
    └── 00005_aggregated_stats_table.sql  # Database migration
```

## File Descriptions

### Core Function Files

#### `index.ts`
- **Purpose**: Main Edge Function implementation
- **Size**: ~500 lines
- **Key Features**:
  - Calculates 20+ different statistics across 8 categories
  - Multi-tenant support (processes all active tenants)
  - UPSERT logic for updating existing stats
  - Comprehensive error handling
  - CORS support
- **Statistics Calculated**:
  - User stats (total, verified, pending, by membership type)
  - Event stats (total, this month, published, RSVPs)
  - Marketplace stats (total, sold, active)
  - Forum stats (threads, posts, categories)
  - Article stats (total, published)
  - Professional profile stats (total, approved)
  - Moderation stats (pending items)
  - Gamification stats (badges awarded)

#### `deno.json`
- **Purpose**: Deno configuration and dependencies
- **Key Dependencies**:
  - `@supabase/supabase-js@2.39.3` - Supabase client
  - `std@0.168.0` - Deno standard library
- **Compiler Options**: Strict TypeScript settings
- **Tasks**: `serve` and `test` commands

### Configuration Files

#### `.cron.yaml`
- **Purpose**: Cron schedule configuration
- **Schedule**: `0 */6 * * *` (every 6 hours)
- **Alternative schedules** provided in comments

### Database Files

#### `00005_aggregated_stats_table.sql`
- **Purpose**: Database migration for aggregated_stats table
- **Schema**:
  - `id` (UUID) - Primary key
  - `tenant_id` (UUID) - Foreign key to tenants
  - `stat_key` (TEXT) - Unique stat identifier
  - `stat_value` (BIGINT) - Calculated value
  - `metadata` (JSONB) - Additional context
  - `updated_at` (TIMESTAMPTZ) - Last update timestamp
- **Indexes**: 3 indexes for fast lookups
- **RLS Policies**:
  - Admins can read stats for their tenant
  - Service role can manage all stats

#### `drizzle-schema-snippet.ts`
- **Purpose**: Drizzle ORM schema definition
- **Includes**:
  - Table definition
  - Relations
  - TypeScript types
  - Example queries

### Documentation Files

#### `README.md`
- **Purpose**: Comprehensive function documentation
- **Sections**:
  - Overview and deployment instructions
  - List of all statistics calculated
  - Database schema
  - Reading stats in your app (tRPC & Supabase examples)
  - Performance considerations
  - Monitoring and troubleshooting
  - Security best practices
  - Future enhancements

#### `DEPLOYMENT_GUIDE.md`
- **Purpose**: Step-by-step deployment instructions
- **Sections**:
  - Prerequisites
  - 9-step deployment process
  - Troubleshooting guide
  - Performance optimization
  - Monitoring & alerts
  - Cost optimization
  - Security best practices

#### `FILES.md`
- **Purpose**: This file - complete file listing and descriptions

### Integration Files

#### `example-trpc-router.ts`
- **Purpose**: Example tRPC router for reading stats
- **Endpoints**:
  - `getAggregatedStats` - Get all stats as map
  - `getStatByKey` - Get specific stat
  - `getStatsByCategory` - Get stats by category
  - `getDashboardOverview` - Get formatted dashboard data
  - `triggerStatsRecalculation` - Manually trigger function
- **Includes**: React component usage example

### Utility Files

#### `deploy.sh`
- **Purpose**: Automated deployment script
- **Steps**:
  - Checks Supabase CLI installation
  - Deploys Edge Function
  - Sets environment variables
  - Applies database migration
  - Deploys cron configuration
  - Tests the function

#### `test.ts`
- **Purpose**: Test script for the Edge Function
- **Features**:
  - Calls the function via HTTP
  - Displays formatted results
  - Groups stats by category
  - Shows success/error status
- **Usage**: `deno run --allow-net --allow-env test.ts`

## File Sizes (Approximate)

| File | Lines | Size |
|------|-------|------|
| index.ts | 500+ | ~18 KB |
| README.md | 250+ | ~10 KB |
| DEPLOYMENT_GUIDE.md | 450+ | ~18 KB |
| example-trpc-router.ts | 200+ | ~7 KB |
| 00005_aggregated_stats_table.sql | 50+ | ~2 KB |
| deno.json | 20+ | ~500 B |
| .cron.yaml | 10+ | ~300 B |
| deploy.sh | 100+ | ~3 KB |
| test.ts | 80+ | ~2.5 KB |
| drizzle-schema-snippet.ts | 100+ | ~3 KB |

**Total**: ~65 KB of code and documentation

## Quick Reference

### Deploy Everything

```bash
# 1. Apply migration
supabase db push

# 2. Deploy function
supabase functions deploy aggregate-stats

# 3. Set secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# 4. Test
supabase functions invoke aggregate-stats
```

### Monitor

```bash
# View logs
supabase functions logs aggregate-stats --tail

# Check stats in DB
psql -c "SELECT stat_key, stat_value, updated_at FROM aggregated_stats ORDER BY updated_at DESC LIMIT 10;"
```

### Development

```bash
# Run locally (requires Supabase local development)
supabase functions serve aggregate-stats

# Test locally
deno run --allow-net --allow-env test.ts
```

## Environment Variables Required

| Variable | Source | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Set via CLI | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard > Settings > API | Service role key for bypassing RLS |

## Dependencies

### Runtime (Deno)
- `@supabase/supabase-js@2.39.3` - Supabase client library
- `std@0.168.0` - Deno standard library for HTTP server

### Development
- `supabase` CLI - For deployment and testing
- `deno` - TypeScript runtime (included in Supabase Edge Functions)

## Next Steps

After deploying all files:

1. **Verify deployment**: Check Supabase Dashboard > Edge Functions
2. **Test function**: Run manual invocation
3. **Check database**: Verify stats are being written
4. **Integrate with app**: Add tRPC router and use in dashboard
5. **Monitor**: Set up logging and alerts
6. **Optimize**: Adjust cron frequency based on needs

## Support

For issues or questions:
- Review `README.md` for function documentation
- Review `DEPLOYMENT_GUIDE.md` for deployment steps
- Check Supabase documentation: https://supabase.com/docs
- Check function logs: `supabase functions logs aggregate-stats`
