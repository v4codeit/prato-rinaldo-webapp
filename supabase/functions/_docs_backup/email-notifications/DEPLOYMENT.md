# Email Notifications Deployment Guide

Complete step-by-step guide to deploy the email notifications Edge Function.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project created
- Resend account (free tier available)
- Domain verified in Resend (optional but recommended)

## Step 1: Setup Resend

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Free tier includes 3,000 emails/month

2. **Verify Your Domain (Optional but Recommended)**
   ```
   Domain: pratorinaldo.it
   ```
   - Add the provided DNS records (SPF, DKIM, DMARC)
   - Wait for verification (can take up to 24 hours)
   - If you skip this, you can only send from `onboarding@resend.dev`

3. **Create API Key**
   - Go to API Keys section
   - Click "Create API Key"
   - Name: `Prato Rinaldo Notifications`
   - Permissions: Send access
   - Copy the key (starts with `re_`)

## Step 2: Configure Supabase Secrets

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set APP_URL=https://pratorinaldo.it

# Generate and set webhook secret
# On Linux/Mac:
openssl rand -base64 32
supabase secrets set WEBHOOK_SECRET=<generated-secret>

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
supabase secrets set WEBHOOK_SECRET=<generated-secret>

# Verify secrets (won't show values, just names)
supabase secrets list
```

## Step 3: Deploy the Edge Function

```bash
# Navigate to project root
cd D:\develop\pratorinaldo-next

# Deploy the function
supabase functions deploy email-notifications

# Expected output:
# Deploying Function...
# Function deployed: https://your-project.supabase.co/functions/v1/email-notifications
```

## Step 4: Setup Database Webhooks

### Option A: Using SQL Script (Recommended)

1. **Edit the SQL script**
   ```bash
   # Open setup-webhooks.sql
   # Replace 'your-project' with your actual Supabase project reference
   ```

2. **Set the webhook secret in database**
   ```sql
   -- In Supabase SQL Editor, run:
   ALTER DATABASE postgres
   SET app.settings.webhook_secret TO 'your-webhook-secret-here';
   ```

3. **Execute the setup script**
   ```bash
   # Run in Supabase SQL Editor
   # Copy and paste the entire setup-webhooks.sql file
   ```

### Option B: Using Supabase Dashboard

1. Go to **Database** > **Webhooks**
2. Click **Enable Webhooks** if not already enabled
3. Click **Create Webhook**

For each of the three webhooks:

**Webhook 1: Marketplace Items**
```
Name: marketplace-email-notifications
Table: marketplace_items
Events: UPDATE
Webhook Type: HTTP Request
Method: POST
URL: https://your-project.supabase.co/functions/v1/email-notifications
Headers:
  Content-Type: application/json
  x-webhook-signature: your-webhook-secret
```

**Webhook 2: Professional Profiles**
```
Name: professional-email-notifications
Table: professional_profiles
Events: UPDATE
Webhook Type: HTTP Request
Method: POST
URL: https://your-project.supabase.co/functions/v1/email-notifications
Headers:
  Content-Type: application/json
  x-webhook-signature: your-webhook-secret
```

**Webhook 3: User Verification**
```
Name: user-verification-notifications
Table: users
Events: UPDATE
Webhook Type: HTTP Request
Method: POST
URL: https://your-project.supabase.co/functions/v1/email-notifications
Headers:
  Content-Type: application/json
  x-webhook-signature: your-webhook-secret
```

## Step 5: Test the Setup

### Test Locally First (Recommended)

```bash
# Start local Supabase (if not already running)
supabase start

# Serve the function locally
supabase functions serve email-notifications --env-file ./supabase/.env.local

# In another terminal, send a test request
curl -X POST http://localhost:54321/functions/v1/email-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-webhook-signature: your-webhook-secret" \
  -d '{
    "type": "UPDATE",
    "table": "marketplace_items",
    "record": {
      "id": "test-123",
      "status": "approved",
      "seller_id": "seller-uuid",
      "title": "Test Item",
      "price": 50.00,
      "donation_percentage": 10
    },
    "old_record": {
      "status": "pending"
    }
  }'
```

### Test in Production

```bash
# Get a real item ID from your database
# Then update its status to trigger the webhook

# Option 1: Via Supabase SQL Editor
UPDATE marketplace_items
SET status = 'approved'
WHERE id = 'real-item-id';

# Option 2: Via your application
# Just use the normal moderation flow
```

### Verify Email Was Sent

1. Check Resend Dashboard > Emails
2. Look for the email in the list
3. Check status (delivered, bounced, etc.)

## Step 6: Monitor and Debug

### View Function Logs

```bash
# Real-time logs
supabase functions logs email-notifications --follow

# Recent logs (last 100 entries)
supabase functions logs email-notifications --limit 100
```

### Common Issues and Solutions

**Issue: "Missing required environment variables"**
- Solution: Verify secrets are set: `supabase secrets list`
- Re-deploy after setting secrets: `supabase functions deploy email-notifications`

**Issue: "Failed to fetch seller data"**
- Solution: Check that the user exists in the database
- Verify user has an email address set

**Issue: "Resend API error: 403 Forbidden"**
- Solution: Verify API key is correct
- Check that your domain is verified in Resend
- Or use onboarding@resend.dev as sender (free tier limitation)

**Issue: "Invalid webhook signature"**
- Solution: Ensure WEBHOOK_SECRET matches in both:
  - Supabase secrets
  - Database configuration (app.settings.webhook_secret)
  - Webhook headers

**Issue: "Email not received"**
- Solution: Check spam folder
- Verify email address in database is correct
- Check Resend dashboard for delivery status
- Look at function logs for errors

**Issue: "Webhook not triggered"**
- Solution: Verify triggers exist: Run verification query in setup-webhooks.sql
- Check that pg_net extension is enabled
- Review webhook configuration in Dashboard

## Step 7: Production Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend (optional)
- [ ] Webhook secret set and matches everywhere
- [ ] Edge Function deployed successfully
- [ ] Database triggers created
- [ ] Test email sent successfully
- [ ] Function logs show no errors
- [ ] Resend dashboard shows email delivered

## Updating the Function

When you make changes to the function code:

```bash
# Test locally first
supabase functions serve email-notifications

# Deploy when ready
supabase functions deploy email-notifications

# Monitor for errors
supabase functions logs email-notifications --follow
```

## Rollback

If something goes wrong:

```bash
# Delete the Edge Function
supabase functions delete email-notifications

# Remove database triggers
# Run the CLEANUP section from setup-webhooks.sql
```

## Cost Estimates

**Supabase:**
- Edge Functions: Free tier includes 500K invocations/month
- Typical usage: ~100-500 invocations/month
- Cost: $0

**Resend:**
- Free tier: 3,000 emails/month
- Typical usage: ~50-200 emails/month
- Cost: $0

**Total monthly cost: $0** for small communities

## Security Best Practices

1. **Never commit secrets to git**
   - Use Supabase secrets for all sensitive values
   - .env files are gitignored

2. **Always use webhook signature verification**
   - Prevents unauthorized webhook calls
   - Uses HMAC-based verification

3. **Use service role key carefully**
   - Only used server-side in Edge Functions
   - Never exposed to client

4. **Keep Resend API key secure**
   - Rotate periodically (every 90 days)
   - Use separate keys for dev/prod

## Support and Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend API Documentation](https://resend.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [pg_net Extension Docs](https://github.com/supabase/pg_net)

## Troubleshooting Commands

```bash
# Check if function exists
supabase functions list

# Check secrets (only shows names)
supabase secrets list

# Unset a secret
supabase secrets unset SECRET_NAME

# View function details
supabase functions describe email-notifications

# Test webhook endpoint
curl -i https://your-project.supabase.co/functions/v1/email-notifications

# Check database triggers
-- Run in SQL Editor:
SELECT * FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%';
```
