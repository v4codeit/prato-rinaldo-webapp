# Quick Start - Proposal Email Notifications

## 🚀 Deploy in 3 Steps

### Step 1: Deploy Edge Function
```bash
pnpm exec supabase functions deploy email-notifications
```

### Step 2: Apply Database Migration
```bash
pnpm exec supabase db push
```

### Step 3: Test
```bash
cd supabase/functions/email-notifications
deno run --allow-net --allow-env test-proposals.ts
```

---

## 📧 What Gets Sent?

### New Comment → Proposal Author
**Trigger:** Someone comments on a proposal
**Recipient:** Proposal author
**Exception:** No email if author comments on their own proposal

### Status Change → All Voters
**Trigger:** Admin changes proposal status
**Recipients:** All users who voted on the proposal
**Exception:** No emails if no one voted

---

## 🔍 Verify Setup

### Check Triggers
```bash
pnpm exec supabase db execute \
  "SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_name LIKE 'proposal%';"
```

Expected output:
```
proposal_comments_webhook | proposal_comments
proposals_status_webhook  | proposals
```

### Check Function Logs
```bash
pnpm exec supabase functions logs email-notifications --limit 20
```

Look for: `"Email sent successfully"`

---

## 🧪 Manual Test

### Test Comment Notification
```sql
-- Create test proposal (if needed)
INSERT INTO proposals (tenant_id, category_id, author_id, title, description, status)
SELECT
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM proposal_categories LIMIT 1),
  (SELECT id FROM users WHERE email IS NOT NULL LIMIT 1),
  'Test Proposal',
  'Test description',
  'proposed';

-- Add comment from different user
INSERT INTO proposal_comments (tenant_id, proposal_id, user_id, content)
SELECT
  (SELECT tenant_id FROM proposals ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM proposals ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM users WHERE email IS NOT NULL AND id != (
    SELECT author_id FROM proposals ORDER BY created_at DESC LIMIT 1
  ) LIMIT 1),
  'This is a test comment to trigger email notification';
```

Check proposal author's email inbox.

### Test Status Change Notification
```sql
-- First, add votes from multiple users
INSERT INTO proposal_votes (proposal_id, user_id, vote_type)
SELECT
  (SELECT id FROM proposals ORDER BY created_at DESC LIMIT 1),
  u.id,
  'up'
FROM users u
WHERE u.email IS NOT NULL
LIMIT 3;

-- Then change status
UPDATE proposals
SET status = 'approved'
WHERE id = (SELECT id FROM proposals ORDER BY created_at DESC LIMIT 1);
```

Check voter email inboxes (3 emails should be sent).

---

## ⚠️ Troubleshooting

### Emails Not Sent?

**Check 1: Resend API Key**
```bash
pnpm exec supabase secrets list | grep RESEND
```

**Check 2: User has email**
```sql
SELECT id, name, email FROM users WHERE id = 'USER_ID';
```

**Check 3: Function errors**
```bash
pnpm exec supabase functions logs email-notifications --limit 50
```

### Disable Notifications (Emergency)
```sql
-- Disable both triggers
ALTER TABLE proposal_comments DISABLE TRIGGER proposal_comments_webhook;
ALTER TABLE proposals DISABLE TRIGGER proposals_status_webhook;
```

Re-enable:
```sql
ALTER TABLE proposal_comments ENABLE TRIGGER proposal_comments_webhook;
ALTER TABLE proposals ENABLE TRIGGER proposals_status_webhook;
```

---

## 📊 Monitor Usage

### Check Sent Emails (Last 24h)
Check Resend Dashboard: [https://resend.com/emails](https://resend.com/emails)

### Check Activity
```sql
-- Comments today
SELECT COUNT(*) FROM proposal_comments
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Status changes today
SELECT COUNT(*) FROM proposals
WHERE updated_at > NOW() - INTERVAL '24 hours'
AND status != 'proposed';
```

---

## 📚 Full Documentation

- **Implementation Details:** `/PROPOSAL_EMAIL_NOTIFICATIONS_IMPLEMENTATION.md`
- **Deployment Guide:** `supabase/functions/email-notifications/PROPOSAL_NOTIFICATIONS_DEPLOYMENT.md`
- **Test Suite:** `supabase/functions/email-notifications/test-proposals.ts`

---

**Status:** ✅ Ready for production
**Version:** 1.0.0
**Last Updated:** January 2025
