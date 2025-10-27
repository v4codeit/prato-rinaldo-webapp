# Email Notifications - Quick Start Guide

## 5-Minute Setup

### 1. Get Resend API Key
```
1. Go to https://resend.com
2. Sign up for free account
3. Create API key
4. Copy key (starts with re_)
```

### 2. Deploy to Supabase
```bash
# Set environment variables
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set WEBHOOK_SECRET=$(openssl rand -base64 32)
supabase secrets set APP_URL=https://pratorinaldo.it

# Deploy function
supabase functions deploy email-notifications
```

### 3. Setup Database Triggers
```bash
# Open Supabase SQL Editor
# Copy and paste setup-webhooks.sql
# Edit line 16 and 35: Replace 'your-project' with your project ref
# Execute the script
```

### 4. Test It
```bash
# Using PowerShell (Windows)
.\test.ps1 all

# Using Bash (Linux/Mac)
chmod +x test.sh
./test.sh all
```

## What Gets Sent

| Event | Recipient | Template |
|-------|-----------|----------|
| Marketplace item approved | Seller | Green success email |
| Marketplace item rejected | Seller | Red rejection email with reason |
| Professional profile approved | Professional | Green success email |
| Professional profile rejected | Professional | Red rejection email with reason |
| User verification approved | User | Purple welcome email |

## Files Explained

```
email-notifications/
├── index.ts              ← Main Edge Function code (21KB)
├── deno.json            ← Deno configuration
├── setup-webhooks.sql   ← Database trigger setup
├── test.sh              ← Testing script (Linux/Mac)
├── test.ps1             ← Testing script (Windows)
├── README.md            ← Complete documentation
├── DEPLOYMENT.md        ← Step-by-step deployment
├── IMPLEMENTATION.md    ← Technical details
└── .env.example         ← Environment variables template
```

## Quick Commands

```bash
# Deploy
supabase functions deploy email-notifications

# View logs
supabase functions logs email-notifications --follow

# Test locally
supabase functions serve email-notifications

# List secrets
supabase secrets list

# Delete function (if needed)
supabase functions delete email-notifications
```

## Environment Variables

Copy `.env.example` and set these in Supabase:

```bash
SUPABASE_URL=https://xxx.supabase.co        # Auto-provided
SUPABASE_SERVICE_ROLE_KEY=xxx               # Auto-provided
RESEND_API_KEY=re_xxx                       # Get from Resend
WEBHOOK_SECRET=xxx                          # Generate random
APP_URL=https://pratorinaldo.it             # Your domain
```

## Verify Setup

Run these checks:

```bash
# 1. Check function exists
supabase functions list

# 2. Check secrets are set
supabase secrets list

# 3. Check triggers exist (in SQL Editor)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%';

# 4. Send test email
# Update a marketplace item status in your app or database
```

## Troubleshooting

**No email received?**
```bash
# Check logs
supabase functions logs email-notifications

# Check Resend dashboard
# https://resend.com/emails

# Verify user has email
SELECT email FROM users WHERE id = 'user-id';
```

**Function not triggered?**
```sql
-- Check triggers exist
SELECT * FROM information_schema.triggers
WHERE event_object_table IN ('marketplace_items', 'professional_profiles', 'users');
```

**Webhook signature error?**
```bash
# Make sure WEBHOOK_SECRET matches in:
# 1. Supabase secrets
# 2. Database config (setup-webhooks.sql line 15, 34, 53)
```

## Email Template Preview

All emails include:
- Professional HTML styling
- Responsive design (mobile-friendly)
- Branded header with colors
- Clear call-to-action button
- Footer with committee info
- No-reply notice

**Color Themes:**
- Approved: Green (#059669)
- Rejected: Red (#dc2626)
- Welcome: Purple (#7c3aed)
- Marketplace: Cyan (#0891b2)

## Cost (Free Tier)

- Supabase: 500K function calls/month → **$0**
- Resend: 3,000 emails/month → **$0**
- Total: **$0/month** for typical usage

## Next Steps

1. ✅ Complete setup above
2. ✅ Test with real user accounts
3. ✅ Verify domain in Resend (optional)
4. ✅ Customize email templates (edit index.ts)
5. ✅ Monitor logs for first week
6. ✅ Add to production checklist

## Support

- Full docs: See README.md
- Deployment: See DEPLOYMENT.md
- Technical: See IMPLEMENTATION.md
- Issues: Check Supabase/Resend dashboards
