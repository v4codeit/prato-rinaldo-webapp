# Proposal Email Notifications - Deployment Guide

## Overview

This guide covers the deployment of email notifications for Agorà proposals system.

**Features implemented:**
1. **New comment notification** → Proposal author receives email when someone comments
2. **Status change notification** → All voters receive email when proposal status changes

---

## 1. Prerequisites

### Required Environment Variables

Ensure these are set in your Supabase project:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx        # Resend API key (already exists)
SUPABASE_URL=https://xxx.supabase.co   # Auto-injected by Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...    # Auto-injected by Supabase
APP_URL=https://pratorinaldo.it        # Frontend URL (optional, defaults set)
```

### Verify Resend API Key

```bash
# Check if RESEND_API_KEY is set
pnpm exec supabase secrets list
```

If not set:
```bash
pnpm exec supabase secrets set RESEND_API_KEY=re_your_actual_key_here
```

---

## 2. Deploy Edge Function

### Step 1: Deploy the Function

From the project root:

```bash
pnpm exec supabase functions deploy email-notifications
```

**Expected output:**
```
Deploying Functions...
  email-notifications: https://xxx.supabase.co/functions/v1/email-notifications
```

### Step 2: Verify Deployment

```bash
# Test the function endpoint (should return 405 for GET)
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-notifications
```

Expected: `{"error":"Method not allowed"}` (200 status code)

---

## 3. Setup Database Webhooks

### Option A: Apply Migration (Recommended)

```bash
# Apply the migration
pnpm exec supabase db push

# Verify triggers were created
pnpm exec supabase db execute \
  "SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers
   WHERE trigger_name IN ('proposal_comments_webhook', 'proposals_status_webhook');"
```

**Expected output:**
```
trigger_name              | event_manipulation | event_object_table
--------------------------+--------------------+--------------------
proposal_comments_webhook | INSERT             | proposal_comments
proposals_status_webhook  | UPDATE             | proposals
```

### Option B: Manual Setup (Alternative)

If you prefer manual setup, run the SQL from:
```
supabase/migrations/00027_proposal_email_notifications_webhooks.sql
```

---

## 4. Testing

### Test 1: New Comment Notification

**Steps:**
1. Log in as User A
2. Create a proposal
3. Log in as User B
4. Comment on User A's proposal
5. Check User A's email inbox

**Expected result:**
- User A receives email: "Nuovo commento sulla tua proposta: [Title]"
- Email contains User B's name and comment preview
- Link redirects to `/agora/{proposal_id}`

**No notification scenarios:**
- User A comments on their own proposal (no self-notification)

### Test 2: Status Change Notification

**Steps:**
1. Log in as User A and User B
2. Both vote on a proposal
3. Log in as Admin
4. Change proposal status from "proposed" to "approved"
5. Check both User A and User B's email inboxes

**Expected result:**
- Both users receive email: "Aggiornamento proposta: [Title]"
- Email shows new status with correct Italian label
- If status is "declined", decline reason is shown
- Link redirects to `/agora/{proposal_id}`

**No notification scenarios:**
- No one voted on the proposal (no emails sent)
- Status didn't change (no emails sent)

### Test 3: Edge Cases

**Test self-comment suppression:**
```sql
-- Insert comment as proposal author (should NOT send email)
INSERT INTO proposal_comments (proposal_id, user_id, content, tenant_id)
SELECT
  p.id,
  p.author_id,
  'This is a self-comment',
  p.tenant_id
FROM proposals p
WHERE p.id = 'YOUR_PROPOSAL_ID';
```

**Expected:** No email sent, function returns `"Commenter is proposal author, no notification sent"`

**Test multiple voters:**
```sql
-- Check how many voters will be notified
SELECT COUNT(DISTINCT pv.user_id) as voter_count
FROM proposal_votes pv
JOIN users u ON u.id = pv.user_id
WHERE pv.proposal_id = 'YOUR_PROPOSAL_ID'
AND u.email IS NOT NULL;
```

---

## 5. Monitoring

### Check Function Logs

Via Supabase Dashboard:
1. Go to **Edge Functions** → **email-notifications**
2. Click **Logs** tab
3. Look for:
   - `"Email sent successfully"` (success)
   - `"Error fetching..."` (database errors)
   - `"Resend API error"` (email sending errors)

Via CLI:
```bash
pnpm exec supabase functions logs email-notifications --follow
```

### Check Database Webhooks

```sql
-- Check if triggers are firing (look at updated_at changes)
SELECT
  id,
  title,
  status,
  updated_at
FROM proposals
ORDER BY updated_at DESC
LIMIT 5;

-- Check recent comments
SELECT
  pc.id,
  p.title as proposal_title,
  u.name as commenter_name,
  pc.created_at
FROM proposal_comments pc
JOIN proposals p ON p.id = pc.proposal_id
JOIN users u ON u.id = pc.user_id
ORDER BY pc.created_at DESC
LIMIT 5;
```

---

## 6. Rollback Plan

If issues occur, disable webhooks temporarily:

```sql
-- Disable comment notifications
ALTER TABLE proposal_comments DISABLE TRIGGER proposal_comments_webhook;

-- Disable status change notifications
ALTER TABLE proposals DISABLE TRIGGER proposals_status_webhook;
```

**To re-enable:**
```sql
ALTER TABLE proposal_comments ENABLE TRIGGER proposal_comments_webhook;
ALTER TABLE proposals ENABLE TRIGGER proposals_status_webhook;
```

---

## 7. Performance Considerations

### Email Rate Limits

**Resend Free Tier:**
- 100 emails/day
- 3,000 emails/month

**If exceeding limits:**
- Upgrade Resend plan
- Implement batching (group notifications)
- Add daily digest option (users receive one email per day with all updates)

### Database Impact

**Webhook overhead:**
- Each INSERT/UPDATE triggers HTTP POST to Edge Function
- Function makes 2-4 database queries (fetch users, proposal data)
- Average processing time: ~500ms per notification

**Optimization tips:**
- Webhooks run AFTER transaction commits (non-blocking)
- Function returns 200 immediately to avoid retries
- Database indexes already exist on FK columns

---

## 8. Troubleshooting

### Issue: Emails not sent

**Check 1: Verify RESEND_API_KEY**
```bash
pnpm exec supabase secrets list
```

**Check 2: Check function logs**
```bash
pnpm exec supabase functions logs email-notifications --limit 50
```

**Check 3: Verify user emails exist**
```sql
SELECT id, name, email FROM users WHERE email IS NULL OR email = '';
```

### Issue: Multiple emails sent

**Cause:** Webhook retries due to function errors

**Solution:**
- Function already returns 200 on all errors (no retries)
- Check logs for duplicate entries
- Implement idempotency key if needed (future enhancement)

### Issue: Emails stuck in spam

**Solution:**
- Configure Resend SPF/DKIM records
- Add unsubscribe link (future enhancement)
- Use verified sender domain

---

## 9. Future Enhancements

**Possible additions:**
1. **Email preferences** - Let users opt-out of specific notification types
2. **Digest mode** - Send one daily email instead of real-time
3. **Slack integration** - Also post to committee Slack channel
4. **Email templates** - Use external HTML templates (Resend templates)
5. **Reply-to-comment** - Support email replies that post to proposal
6. **Notification center** - In-app notifications alongside emails

---

## 10. Support

**Documentation:**
- Edge Functions: [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- Resend API: [Resend Docs](https://resend.com/docs)
- Database Webhooks: [Postgres Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

**Contact:**
- Technical issues: Check function logs first
- Email delivery issues: Check Resend dashboard
- Database issues: Check Supabase dashboard logs

---

**Deployment Date:** January 2025
**Version:** 1.0.0
**Maintainer:** Prato Rinaldo Dev Team
