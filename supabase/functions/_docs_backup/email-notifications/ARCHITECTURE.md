# Email Notifications Architecture

## System Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  PRATO RINALDO WEB APPLICATION                                            │
│                                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐                │
│  │   Admin     │  │  Moderator   │  │  Auto Approval   │                │
│  │  Actions    │  │  Dashboard   │  │    System        │                │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬────────┘                │
│         │                │                     │                         │
│         └────────────────┴─────────────────────┘                         │
│                          │                                               │
│                          ▼                                               │
│         ┌────────────────────────────────────┐                           │
│         │   UPDATE Status in Database        │                           │
│         │   - marketplace_items              │                           │
│         │   - professional_profiles          │                           │
│         │   - users (verification_status)    │                           │
│         └────────────────┬───────────────────┘                           │
│                          │                                               │
└──────────────────────────┼───────────────────────────────────────────────┘
                           │
                           │ Database UPDATE Event
                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  POSTGRESQL DATABASE (Supabase)                                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Table: marketplace_items                                       │    │
│  │  ┌──────────────────────────────────────────────────────┐       │    │
│  │  │ TRIGGER: marketplace_status_change_trigger           │       │    │
│  │  │ FUNCTION: notify_marketplace_status_change()         │       │    │
│  │  │ FIRES: AFTER UPDATE                                  │       │    │
│  │  │ CONDITION: OLD.status != NEW.status                  │       │    │
│  │  └──────────────────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Table: professional_profiles                                   │    │
│  │  ┌──────────────────────────────────────────────────────┐       │    │
│  │  │ TRIGGER: professional_status_change_trigger          │       │    │
│  │  │ FUNCTION: notify_professional_status_change()        │       │    │
│  │  │ FIRES: AFTER UPDATE                                  │       │    │
│  │  │ CONDITION: OLD.status != NEW.status                  │       │    │
│  │  └──────────────────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Table: users                                                   │    │
│  │  ┌──────────────────────────────────────────────────────┐       │    │
│  │  │ TRIGGER: user_verification_change_trigger            │       │    │
│  │  │ FUNCTION: notify_user_verification_change()          │       │    │
│  │  │ FIRES: AFTER UPDATE                                  │       │    │
│  │  │ CONDITION: OLD.verification_status != NEW...         │       │    │
│  │  └──────────────────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          │ HTTP POST via pg_net extension                │
│                          ▼                                               │
└───────────────────────────────────────────────────────────────────────────┘
                           │
                           │ Webhook Payload
                           │ {
                           │   type: "UPDATE",
                           │   table: "...",
                           │   record: {...},
                           │   old_record: {...}
                           │ }
                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  SUPABASE EDGE FUNCTION: email-notifications                             │
│  Runtime: Deno (JavaScript/TypeScript)                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 1: Verify Request                                          │    │
│  │  - Check HTTP method (POST only)                                │    │
│  │  - Verify webhook signature (x-webhook-signature header)        │    │
│  │  - Parse JSON payload                                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 2: Process Webhook Data                                    │    │
│  │  - Extract table name and event type                            │    │
│  │  - Compare old_record vs new record                             │    │
│  │  - Detect status changes                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 3: Fetch Related Data                                      │    │
│  │  Using Supabase Client (Service Role Key):                      │    │
│  │  - Query users table for recipient email                        │    │
│  │  - Query moderation_actions_log for rejection reason            │    │
│  │  - Build email data object                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 4: Select Email Template                                   │    │
│  │  Templates Available:                                           │    │
│  │  ┌───────────────────────────────────────────────────┐          │    │
│  │  │ marketplaceApproved (Green theme)                 │          │    │
│  │  │ marketplaceRejected (Red theme)                   │          │    │
│  │  │ professionalApproved (Green theme)                │          │    │
│  │  │ professionalRejected (Red theme)                  │          │    │
│  │  │ userVerificationApproved (Purple theme)           │          │    │
│  │  └───────────────────────────────────────────────────┘          │    │
│  │  - Inject dynamic data into template                            │    │
│  │  - Generate HTML email body                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 5: Send Email                                               │    │
│  │  POST https://api.resend.com/emails                             │    │
│  │  Headers:                                                        │    │
│  │    Authorization: Bearer {RESEND_API_KEY}                       │    │
│  │  Body:                                                           │    │
│  │    from: "Prato Rinaldo <noreply@pratorinaldo.it>"             │    │
│  │    to: [recipient.email]                                        │    │
│  │    subject: "..."                                               │    │
│  │    html: "..."                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Step 6: Return Response                                         │    │
│  │  Success: { success: true, sent: 1, message: "..." }           │    │
│  │  Error: { error: "...", message: "..." }                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────┬───────────────────────────────────────────────┘
                            │
                            │ HTTP POST (TLS 1.2+)
                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  RESEND EMAIL SERVICE (api.resend.com)                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Email Processing                                                 │    │
│  │  - Validate API key                                              │    │
│  │  - Verify sender domain (if configured)                          │    │
│  │  - Queue email for delivery                                      │    │
│  │  - Return email ID                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ SMTP Delivery                                                    │    │
│  │  - SPF/DKIM signing                                              │    │
│  │  - Bounce handling                                               │    │
│  │  - Delivery tracking                                             │    │
│  │  - Spam score optimization                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                          │                                               │
└──────────────────────────┼───────────────────────────────────────────────┘
                           │
                           │ Email Delivery
                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  END USER EMAIL CLIENT                                                    │
│  (Gmail, Outlook, Apple Mail, etc.)                                      │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  📧 Email Received                                               │    │
│  │                                                                  │    │
│  │  From: Prato Rinaldo <noreply@pratorinaldo.it>                  │    │
│  │  Subject: Il tuo annuncio è stato approvato!                    │    │
│  │                                                                  │    │
│  │  [Professional HTML email with branding]                        │    │
│  │  [Call-to-action button]                                        │    │
│  │  [Footer information]                                           │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Details

### Trigger Execution Flow

```
User Action → UPDATE Query → Trigger Fired → Function Executed → HTTP Request
```

**Example: Marketplace Item Approval**

```sql
-- Admin approves item
UPDATE marketplace_items
SET status = 'approved',
    approved_by = 'admin-uuid',
    approved_at = NOW()
WHERE id = 'item-123';

-- Trigger fires
AFTER UPDATE ON marketplace_items
  IF OLD.status != NEW.status THEN
    CALL notify_marketplace_status_change()

-- Function sends webhook
SELECT net.http_post(
  url := 'https://xyz.supabase.co/functions/v1/email-notifications',
  body := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'marketplace_items',
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  )
)
```

### Edge Function Processing

```
1. Request arrives at Edge Function
   ├─> Verify webhook signature
   ├─> Parse JSON payload
   └─> Extract table and event type

2. Determine email type
   ├─> marketplace_items + approved → marketplaceApproved
   ├─> marketplace_items + rejected → marketplaceRejected
   ├─> professional_profiles + approved → professionalApproved
   ├─> professional_profiles + rejected → professionalRejected
   └─> users + verification_status: approved → userVerificationApproved

3. Fetch user data
   ├─> Query users table by seller_id/user_id
   ├─> Get email, name
   └─> Get rejection reason from moderation_actions_log (if rejected)

4. Build email
   ├─> Select template
   ├─> Inject dynamic data
   └─> Generate HTML

5. Send via Resend
   ├─> POST to api.resend.com/emails
   ├─> Include API key in headers
   └─> Return email ID

6. Return response
   ├─> Success: { sent: 1 }
   └─> Error: { error: "message" }
```

## Component Interactions

### Database Layer
```
PostgreSQL Tables
  ├─> marketplace_items (with status column)
  ├─> professional_profiles (with status column)
  └─> users (with verification_status column)

PostgreSQL Triggers
  ├─> AFTER UPDATE triggers on each table
  └─> Call notify_* functions

PostgreSQL Functions
  ├─> notify_marketplace_status_change()
  ├─> notify_professional_status_change()
  └─> notify_user_verification_change()

pg_net Extension
  └─> Sends HTTP POST to Edge Function
```

### Application Layer
```
Edge Function (Deno Runtime)
  ├─> HTTP Server (listen for POST)
  ├─> Webhook Verification (signature check)
  ├─> Supabase Client (database queries)
  ├─> Template Engine (HTML generation)
  └─> Resend Client (email sending)

Templates
  ├─> marketplaceApproved (HTML + inline CSS)
  ├─> marketplaceRejected (HTML + inline CSS)
  ├─> professionalApproved (HTML + inline CSS)
  ├─> professionalRejected (HTML + inline CSS)
  └─> userVerificationApproved (HTML + inline CSS)
```

### External Services
```
Resend API
  ├─> Email Validation
  ├─> SMTP Delivery
  ├─> Bounce Handling
  └─> Delivery Tracking
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Security Layers                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Network Security                                        │
│     ├─> HTTPS/TLS 1.2+ for all communications              │
│     ├─> Supabase managed SSL certificates                  │
│     └─> No public database access                          │
│                                                             │
│  2. Authentication                                          │
│     ├─> Webhook signature verification                     │
│     ├─> Service role key for database access               │
│     └─> Resend API key for email sending                   │
│                                                             │
│  3. Authorization                                           │
│     ├─> Edge Function requires valid signature             │
│     ├─> Service role bypasses RLS (needed for triggers)    │
│     └─> Resend validates API key scope                     │
│                                                             │
│  4. Data Protection                                         │
│     ├─> Secrets stored in Supabase Vault                   │
│     ├─> Environment variables encrypted at rest            │
│     └─> No sensitive data in logs                          │
│                                                             │
│  5. Input Validation                                        │
│     ├─> JSON schema validation                             │
│     ├─> Email address validation                           │
│     └─> SQL injection prevention (parameterized queries)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Edge Functions auto-scale based on demand
- Multiple instances handle concurrent requests
- No single point of failure

### Performance Optimization
- Asynchronous email sending
- Database indexes on frequently queried columns
- Template caching in memory
- Connection pooling for database

### Rate Limiting
- Resend: 100 req/s (free tier: 10 req/s)
- Supabase Edge Functions: 50 concurrent (default)
- Database triggers: No limit (async processing)

## Monitoring & Observability

```
┌──────────────────────────────────────────────────────────┐
│ Monitoring Stack                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Application Logs                                        │
│  ├─> Edge Function logs (supabase CLI)                  │
│  ├─> Database logs (Supabase Dashboard)                 │
│  └─> Webhook execution logs                             │
│                                                          │
│  Email Delivery Tracking                                │
│  ├─> Resend Dashboard                                   │
│  ├─> Delivery status (sent/delivered/bounced)           │
│  └─> Open/click tracking (if enabled)                   │
│                                                          │
│  Error Tracking                                          │
│  ├─> Function execution errors                          │
│  ├─> Database trigger errors                            │
│  └─> Email sending failures                             │
│                                                          │
│  Performance Metrics                                     │
│  ├─> Function execution time                            │
│  ├─> Database query performance                         │
│  └─> Email delivery latency                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | PostgreSQL (Supabase) | Data storage & triggers |
| Runtime | Deno | Edge Function execution |
| Language | TypeScript | Type-safe code |
| HTTP | pg_net | Database → Edge Function |
| Email | Resend API | Email delivery |
| Auth | Supabase Auth | Service role key |
| Security | Webhook signatures | Request validation |
| Monitoring | Supabase Logs | Observability |
| Testing | curl/PowerShell | Integration testing |

## Deployment Architecture

```
Development → Testing → Staging → Production

Local Development:
  - supabase functions serve
  - Local database (optional)
  - .env.local for secrets

Testing:
  - Test scripts (test.sh/test.ps1)
  - Mock email recipients
  - Function logs monitoring

Staging:
  - Separate Supabase project
  - Test domain for emails
  - Full integration testing

Production:
  - Production Supabase project
  - Verified domain (pratorinaldo.it)
  - Monitoring alerts enabled
```
