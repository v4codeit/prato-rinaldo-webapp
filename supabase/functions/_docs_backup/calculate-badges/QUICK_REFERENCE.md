# Calculate Badges - Quick Reference Card

## One-Minute Overview

**What**: Automatic badge awarding system for Prato Rinaldo platform
**How**: Supabase Edge Function running hourly via Cron
**Where**: `supabase/functions/calculate-badges/`

## Files You Need

| File | Purpose |
|------|---------|
| `index.ts` | Main function code |
| `migration-add-badge-slug.sql` | DB schema update |
| `seed-badges.sql` | Badge data |
| `setup-cron.sql` | Cron configuration |

## 5-Step Deployment

```bash
# 1. Migrate database
supabase db execute --file migration-add-badge-slug.sql

# 2. Seed badges (edit tenant_id first!)
supabase db execute --file seed-badges.sql

# 3. Deploy function
supabase functions deploy calculate-badges

# 4. Set up cron (edit project details first!)
supabase db execute --file setup-cron.sql

# 5. Test
curl -i --location --request POST \
  'https://YOUR_REF.supabase.co/functions/v1/calculate-badges' \
  --header 'Authorization: Bearer YOUR_KEY' \
  --header 'Content-Type: application/json'
```

## Or Use Shortcuts

```bash
# Using Makefile
make setup

# Using deploy script
./deploy.sh production
```

## Badge Types (6 Total)

| Badge | Points | Criteria |
|-------|--------|----------|
| Benvenuto | 10 | Complete onboarding |
| Primo Post | 20 | First forum post |
| Venditore | 30 | Sell item |
| Partecipante Attivo | 50 | Attend 5+ events |
| Contributore | 75 | Donate via marketplace |
| Volontario | 100 | Offer volunteer service |

## Essential Commands

```bash
# Deploy
supabase functions deploy calculate-badges

# View logs
supabase functions logs calculate-badges --follow

# Test locally
./test-local.sh

# Check status
make status
```

## Essential SQL

```sql
-- Check cron job
SELECT * FROM cron.job WHERE jobname = 'calculate-badges-hourly';

-- Total badges awarded
SELECT COUNT(*) FROM user_badges;

-- Recent badge awards
SELECT b.name, COUNT(*) FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.name;
```

## Environment Variables

**None required!** Supabase auto-provides:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Cron Schedule

Default: **Every hour** (`0 * * * *`)

Change in `setup-cron.sql` if needed.

## Common Issues

| Problem | Solution |
|---------|----------|
| No badges awarded | Check badge slugs match function code |
| Cron not running | Verify `active = true` in cron.job table |
| Permission errors | Service role key auto-provided by Supabase |

## File Locations

```
D:\develop\pratorinaldo-next\supabase\functions\calculate-badges\
├── index.ts                      ← Main function
├── migration-add-badge-slug.sql  ← DB migration
├── seed-badges.sql               ← Badge data
├── setup-cron.sql                ← Cron setup
├── deploy.sh                     ← Deployment script
└── DEPLOYMENT_GUIDE.md           ← Full instructions
```

## Need Help?

1. **Quick Start**: See OVERVIEW.md
2. **Full Guide**: See DEPLOYMENT_GUIDE.md
3. **Technical**: See README.md
4. **Logs**: `supabase functions logs calculate-badges`

## API Response

```json
{
  "success": true,
  "message": "Processed 45 users, awarded 12 badges",
  "data": {
    "totalProcessed": 45,
    "badgesAwarded": 12,
    "errors": 0,
    "details": [...]
  }
}
```

## Test URLs

Local: `http://localhost:54321/functions/v1/calculate-badges`
Production: `https://YOUR_REF.supabase.co/functions/v1/calculate-badges`

---

**Ready?** Run: `make setup` or follow DEPLOYMENT_GUIDE.md
