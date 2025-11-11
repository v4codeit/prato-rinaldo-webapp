# Email Notifications Deployment Checklist

Use this checklist to ensure proper deployment and testing of the email notifications system.

## Pre-Deployment

### 1. Resend Account Setup
- [ ] Created Resend account at https://resend.com
- [ ] Verified email address
- [ ] Created API key
- [ ] API key copied and saved securely
- [ ] (Optional) Domain verified with DNS records
- [ ] (Optional) SPF, DKIM, DMARC records added

### 2. Supabase Project Setup
- [ ] Supabase project exists
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Project reference ID noted

### 3. Code Review
- [ ] Reviewed `index.ts` for email templates
- [ ] Checked sender email address matches your domain
- [ ] Verified APP_URL is correct
- [ ] Reviewed email content for accuracy
- [ ] Checked all template variables are populated

## Deployment

### 4. Environment Variables
- [ ] Generated webhook secret: `openssl rand -base64 32` (or PowerShell equivalent)
- [ ] Set RESEND_API_KEY: `supabase secrets set RESEND_API_KEY=re_xxx`
- [ ] Set WEBHOOK_SECRET: `supabase secrets set WEBHOOK_SECRET=xxx`
- [ ] Set APP_URL: `supabase secrets set APP_URL=https://pratorinaldo.it`
- [ ] Verified secrets: `supabase secrets list`
- [ ] Secrets show correct names (not values)

### 5. Edge Function Deployment
- [ ] Deployed function: `supabase functions deploy email-notifications`
- [ ] Deployment succeeded without errors
- [ ] Function URL noted (shown in deployment output)
- [ ] Function listed: `supabase functions list`

### 6. Database Triggers
- [ ] Opened `setup-webhooks.sql` file
- [ ] Replaced `your-project` with actual project reference (3 places: lines 16, 35, 54)
- [ ] Opened Supabase SQL Editor
- [ ] Copied entire SQL script
- [ ] Executed script successfully
- [ ] Ran verification query (at bottom of script)
- [ ] Confirmed 3 triggers created:
  - [ ] `marketplace_status_change_trigger`
  - [ ] `professional_status_change_trigger`
  - [ ] `user_verification_change_trigger`

### 7. Database Configuration
- [ ] Set webhook secret in database:
  ```sql
  ALTER DATABASE postgres SET app.settings.webhook_secret TO 'your-webhook-secret';
  ```
- [ ] Verified setting:
  ```sql
  SELECT name, setting FROM pg_settings WHERE name = 'app.settings.webhook_secret';
  ```

## Testing

### 8. Local Testing (Optional but Recommended)
- [ ] Started local function: `supabase functions serve email-notifications`
- [ ] Ran test script: `./test.ps1` or `./test.sh`
- [ ] All 8 tests passed
- [ ] Function logs show no errors
- [ ] (Skip if testing in production directly)

### 9. Production Testing
- [ ] Created test user in database with valid email
- [ ] Created test marketplace item
- [ ] Approved marketplace item via admin panel
- [ ] Checked function logs: `supabase functions logs email-notifications`
- [ ] Verified email sent in Resend dashboard
- [ ] Checked email inbox (including spam folder)
- [ ] Email received and displays correctly

### 10. Test Each Email Type

#### Marketplace Approved
- [ ] Created marketplace item as test user
- [ ] Set status to `approved`
- [ ] Email received with green theme
- [ ] All details correct (title, price, donation %)
- [ ] CTA button links to marketplace
- [ ] Images/styling display correctly

#### Marketplace Rejected
- [ ] Created marketplace item as test user
- [ ] Added rejection reason in moderation_actions_log
- [ ] Set status to `rejected`
- [ ] Email received with red theme
- [ ] Rejection reason displayed
- [ ] CTA button links to edit page

#### Professional Approved
- [ ] Created professional profile as test user
- [ ] Set status to `approved`
- [ ] Email received with green theme
- [ ] All details correct (category, availability, rate)
- [ ] CTA button links to professionals directory

#### Professional Rejected
- [ ] Created professional profile as test user
- [ ] Added rejection reason in moderation_actions_log
- [ ] Set status to `rejected`
- [ ] Email received with red theme
- [ ] Rejection reason displayed

#### User Verification
- [ ] Created user with `pending` verification status
- [ ] Set verification_status to `approved`
- [ ] Welcome email received with purple theme
- [ ] Feature list displays correctly
- [ ] Badge notification shows (+10 points)
- [ ] CTA button links to forum

### 11. Error Handling Tests
- [ ] Tested with non-existent user (should log error gracefully)
- [ ] Tested with user without email (should handle gracefully)
- [ ] Tested wrong webhook signature (should return 401)
- [ ] Tested wrong HTTP method (should return 405)
- [ ] Tested invalid JSON payload (should return 500 with error message)
- [ ] All errors logged properly

## Monitoring Setup

### 12. Logging & Monitoring
- [ ] Can view real-time logs: `supabase functions logs email-notifications --follow`
- [ ] Logs show successful email sends
- [ ] Errors are logged with details
- [ ] Set up log monitoring (optional: alerts via webhook)
- [ ] Resend dashboard accessible
- [ ] Can see delivery status in Resend

### 13. Performance Verification
- [ ] Function responds in < 1 second
- [ ] Emails delivered within 5 seconds
- [ ] No timeout errors
- [ ] Database queries perform well (< 50ms)
- [ ] Function cold start acceptable (< 500ms)

## Production Validation

### 14. Integration Testing
- [ ] Tested full moderation flow:
  1. [ ] User submits marketplace item
  2. [ ] Moderator approves/rejects
  3. [ ] Email sent automatically
  4. [ ] User receives email
  5. [ ] Email content accurate
- [ ] Tested with multiple users simultaneously
- [ ] Confirmed no duplicate emails sent
- [ ] Verified emails respect user preferences (if implemented)

### 15. Security Checks
- [ ] Webhook signature verification working
- [ ] Service role key not exposed in logs
- [ ] API keys not exposed in responses
- [ ] HTTPS used for all communications
- [ ] No sensitive data in email templates
- [ ] Emails can't be spoofed

### 16. Compliance & Best Practices
- [ ] Email includes unsubscribe info (if required)
- [ ] Sender address is no-reply (prevents replies)
- [ ] Email footer includes committee contact info
- [ ] Privacy policy link included (if applicable)
- [ ] GDPR compliance considered (if EU users)

## Documentation

### 17. Team Knowledge Transfer
- [ ] README.md reviewed by team
- [ ] DEPLOYMENT.md accessible to DevOps
- [ ] QUICK-START.md shared with new team members
- [ ] Test scripts demonstrated
- [ ] Monitoring dashboard access granted
- [ ] Runbook created for common issues

### 18. Ongoing Maintenance
- [ ] Schedule for template updates documented
- [ ] Process for adding new email types documented
- [ ] Escalation path for email delivery issues
- [ ] Monthly review scheduled
- [ ] Cost monitoring in place

## Post-Deployment

### 19. Production Monitoring (First Week)
- [ ] Day 1: Check logs hourly
- [ ] Day 2-3: Check logs every 4 hours
- [ ] Day 4-7: Check logs daily
- [ ] Week 2: Check logs every 3 days
- [ ] Month 1: Weekly check-ins
- [ ] Noted any issues or patterns

### 20. Metrics Tracking
- [ ] Track email delivery rate (target: >99%)
- [ ] Track email open rate (target: >30%)
- [ ] Track bounce rate (target: <2%)
- [ ] Track function errors (target: <0.1%)
- [ ] Track average send time (target: <2s)

### 21. User Feedback
- [ ] Solicit feedback from first recipients
- [ ] Check spam reports
- [ ] Review email content clarity
- [ ] Adjust templates if needed
- [ ] Document improvements

## Rollback Plan

### 22. Rollback Preparation
- [ ] Documented rollback steps:
  1. [ ] Delete Edge Function: `supabase functions delete email-notifications`
  2. [ ] Drop triggers: Run CLEANUP section from setup-webhooks.sql
  3. [ ] Unset secrets: `supabase secrets unset RESEND_API_KEY WEBHOOK_SECRET`
- [ ] Tested rollback in staging (if available)
- [ ] Team knows when to rollback
- [ ] Communication plan for rollback scenario

## Sign-Off

### Final Checks
- [ ] All tests passed
- [ ] No critical errors in logs
- [ ] Team trained on system
- [ ] Documentation complete
- [ ] Monitoring active
- [ ] Backup plan ready

**Deployed By**: _________________
**Date**: _________________
**Verified By**: _________________
**Production Approved**: Yes / No

---

## Notes & Issues

Document any issues encountered during deployment:

```
Date | Issue | Resolution | Follow-up Required
-----|-------|-----------|-------------------
     |       |           |
     |       |           |
     |       |           |
```

## Next Steps

After successful deployment:

1. [ ] Monitor for 1 week
2. [ ] Gather user feedback
3. [ ] Optimize templates based on feedback
4. [ ] Consider adding new email types
5. [ ] Schedule quarterly review
6. [ ] Update documentation as needed

---

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Complete | ❌ Blocked

**Last Updated**: _________________
