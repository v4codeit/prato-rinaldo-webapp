# Deployment Checklist - Proposal Email Notifications

## Pre-Deployment

### 1. Environment Check
- [ ] RESEND_API_KEY is set in Supabase secrets
  ```bash
  pnpm exec supabase secrets list | grep RESEND
  ```
- [ ] Supabase project is linked
  ```bash
  pnpm exec supabase status
  ```
- [ ] Local database is synced with remote
  ```bash
  pnpm exec supabase db pull
  ```

### 2. Code Review
- [x] Edge Function updated: `supabase/functions/email-notifications/index.ts`
- [x] Migration created: `supabase/migrations/00027_proposal_email_notifications_webhooks.sql`
- [x] TypeScript type checking passed
- [x] No syntax errors

### 3. Testing Preparation
- [ ] Test user accounts created with valid emails
- [ ] Test proposal created in database
- [ ] Test environment variables configured

---

## Deployment Steps

### Step 1: Backup Current Setup
```bash
# Backup current function
pnpm exec supabase functions download email-notifications --project-ref YOUR_PROJECT_REF

# Backup current database
pnpm exec supabase db dump --file backup-$(date +%Y%m%d).sql
```

### Step 2: Deploy Edge Function
```bash
pnpm exec supabase functions deploy email-notifications
```

**Expected output:**
```
Deploying Functions...
  email-notifications: https://xxx.supabase.co/functions/v1/email-notifications
```

**Verification:**
- [ ] Function deployed successfully
- [ ] No deployment errors in output

### Step 3: Apply Database Migration
```bash
pnpm exec supabase db push
```

**Expected output:**
```
Applying migration 00027_proposal_email_notifications_webhooks.sql...
```

**Verification:**
- [ ] Migration applied successfully
- [ ] No SQL errors

### Step 4: Verify Triggers
```bash
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

**Verification:**
- [ ] Both triggers exist
- [ ] Correct event types (INSERT, UPDATE)
- [ ] Correct tables

---

## Post-Deployment Testing

### Test 1: Comment Notification
```sql
-- Create test comment
INSERT INTO proposal_comments (tenant_id, proposal_id, user_id, content)
SELECT
  (SELECT tenant_id FROM proposals LIMIT 1),
  (SELECT id FROM proposals WHERE author_id != (SELECT id FROM users WHERE email IS NOT NULL LIMIT 1) LIMIT 1),
  (SELECT id FROM users WHERE email IS NOT NULL LIMIT 1),
  'Test comment for email notification';
```

**Verification:**
- [ ] Check function logs for "Email sent successfully"
  ```bash
  pnpm exec supabase functions logs email-notifications --limit 10
  ```
- [ ] Check proposal author's email inbox
- [ ] Email received within 1-2 minutes
- [ ] Email contains correct proposal title
- [ ] Email contains commenter name
- [ ] Link redirects to correct proposal page

### Test 2: Self-Comment (Should NOT Send)
```sql
-- Author comments on their own proposal
INSERT INTO proposal_comments (tenant_id, proposal_id, user_id, content)
SELECT
  p.tenant_id,
  p.id,
  p.author_id,
  'Self-comment test'
FROM proposals p
LIMIT 1;
```

**Verification:**
- [ ] Check function logs for "Commenter is proposal author"
- [ ] Confirm NO email was sent
- [ ] Author did NOT receive notification

### Test 3: Status Change Notification
```sql
-- First, ensure proposal has votes
INSERT INTO proposal_votes (proposal_id, user_id, vote_type)
SELECT
  (SELECT id FROM proposals LIMIT 1),
  u.id,
  'up'
FROM users u
WHERE u.email IS NOT NULL
LIMIT 2;

-- Then change status
UPDATE proposals
SET status = 'approved'
WHERE id = (SELECT id FROM proposals LIMIT 1);
```

**Verification:**
- [ ] Check function logs for "email(s) sent successfully"
- [ ] Check voter email inboxes
- [ ] All voters received notification
- [ ] Email shows correct status change
- [ ] Status label is in Italian

### Test 4: Edge Function Direct Call
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "INSERT",
    "table": "proposal_comments",
    "record": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "proposal_id": "REAL_PROPOSAL_ID",
      "user_id": "REAL_USER_ID",
      "content": "Direct API test",
      "created_at": "2025-01-15T10:00:00Z"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "sent": 1,
  "message": "1 email(s) sent successfully"
}
```

**Verification:**
- [ ] Response is 200 OK
- [ ] JSON contains `"success": true`
- [ ] Email count matches expected

---

## Monitoring Setup

### 1. Enable Function Logs
```bash
# Follow live logs
pnpm exec supabase functions logs email-notifications --follow
```

**Watch for:**
- [x] "Email sent successfully" (success)
- [x] "Error fetching..." (database issues)
- [x] "Resend API error" (email service issues)

### 2. Configure Resend Alerts
1. Go to [Resend Dashboard](https://resend.com/settings/notifications)
2. Enable email notifications for:
   - [ ] Failed deliveries
   - [ ] Bounces
   - [ ] Spam complaints

### 3. Database Monitoring Query
```sql
-- Save this query in Supabase SQL Editor
CREATE OR REPLACE VIEW proposal_notification_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as comments,
  COUNT(DISTINCT proposal_id) as proposals_with_comments
FROM proposal_comments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Verification:**
- [ ] View created successfully
- [ ] Query runs without errors

---

## Rollback Plan (If Issues Occur)

### Disable Notifications Immediately
```sql
-- Disable triggers (does not send emails)
ALTER TABLE proposal_comments DISABLE TRIGGER proposal_comments_webhook;
ALTER TABLE proposals DISABLE TRIGGER proposals_status_webhook;
```

### Restore Previous Function Version
```bash
# Deploy from backup
pnpm exec supabase functions deploy email-notifications --project-ref YOUR_PROJECT_REF --from-backup
```

### Rollback Database Migration
```sql
-- Drop triggers
DROP TRIGGER IF EXISTS proposal_comments_webhook ON proposal_comments;
DROP TRIGGER IF EXISTS proposals_status_webhook ON proposals;

-- Drop functions
DROP FUNCTION IF EXISTS notify_proposal_comment();
DROP FUNCTION IF EXISTS notify_proposal_status_change();
```

---

## Go-Live Checklist

### Final Checks
- [ ] All tests passed
- [ ] Function logs show no errors
- [ ] Resend dashboard shows successful deliveries
- [ ] Email templates render correctly in Gmail, Outlook, Apple Mail
- [ ] Links work correctly (redirect to production URL)
- [ ] Team notified of new feature
- [ ] Documentation updated
- [ ] Monitoring enabled

### Communication
- [ ] Announce feature to users (optional)
- [ ] Update changelog
- [ ] Add to release notes

### Performance Baseline
Record initial metrics:
- **Comments per day:** ____
- **Status changes per day:** ____
- **Emails sent per day:** ____
- **Resend API usage:** ____% of quota

---

## Success Criteria

**Deployment is successful if:**
1. Edge Function deployed without errors
2. Database migration applied successfully
3. Both triggers created and enabled
4. Test emails received by intended recipients
5. Self-comments correctly suppressed
6. Function logs show no errors
7. Resend dashboard shows successful deliveries
8. No increase in error rates

---

## Emergency Contacts

**Technical Issues:**
- Function errors → Check logs first, then disable triggers
- Email delivery issues → Check Resend dashboard
- Database issues → Check Supabase dashboard

**Escalation:**
- Critical failures → Disable triggers immediately
- Data integrity issues → Rollback migration
- Spam complaints → Pause sending, review templates

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1-2
- [ ] Check function logs every 15 minutes
- [ ] Monitor Resend dashboard for delivery rates
- [ ] Verify no increase in error logs

### Hour 2-6
- [ ] Check function logs every hour
- [ ] Verify email delivery success rate > 95%
- [ ] Confirm no spam complaints

### Hour 6-24
- [ ] Check function logs every 4 hours
- [ ] Review total emails sent vs expected
- [ ] Monitor database performance

### Day 2-7
- [ ] Daily log review
- [ ] Weekly metrics report
- [ ] User feedback collection

---

## Completion Sign-Off

**Deployed by:** ________________
**Date:** ________________
**Time:** ________________

**Verified by:** ________________
**Date:** ________________

**Production ready:** ☐ Yes ☐ No

**Issues encountered:** ________________________________________________

**Notes:** ___________________________________________________________

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Next Review:** 7 days after deployment
