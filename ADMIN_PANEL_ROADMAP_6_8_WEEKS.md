# PIANO DI IMPLEMENTAZIONE ADMIN PANEL - 6-8 SETTIMANE

**Progetto:** Prato Rinaldo Community Platform
**Focus:** Completezza Features (Articles + Advanced)
**Timeline:** 6-8 settimane (Gennaio-Marzo 2025)
**Score Attuale:** 55/100
**Score Target:** 95/100

---

## PRIORITÀ SELEZIONATE DALL'UTENTE

1. **Completezza Features (Articles + Advanced)** - Priorità Principale
2. **Dashboard Utente Dettagliato** - User management focus
3. **Moderation Avanzata** - Assegnazione moderatori, Metrics, Filtri avanzati
4. **Timeline:** Completamento full (6-8 settimane)

---

## EXECUTIVE SUMMARY

### Stato Attuale (da Analisi Completa)

| Area | Completezza | Criticità | Settimane Stimate |
|------|-------------|-----------|-------------------|
| **Articles Management** | 0% (schema OK, UI 0%) | 🔴 ALTA | 2-3 settimane |
| **User Dashboard Dettagliato** | 30% (list OK, detail 0%) | 🟡 MEDIA | 1-2 settimane |
| **Moderation Advanced** | 60% (base OK, advanced 0%) | 🟡 MEDIA | 1-2 settimane |
| **Critical Security** | 0% (audit log, GDPR export) | 🟠 MEDIA-ALTA | 1-2 settimane |
| **Dashboard Analytics** | 60% (stats OK, charts 0%) | 🟢 BASSA | 1 settimana |

**Totale Stimato:** 6-10 settimane (sovrapposizioni possibili)

---

## SETTIMANA 1-2: ARTICLES MANAGEMENT SYSTEM (PRIORITÀ 1)

### Obiettivo
Portare Articles da 0% a 100% - Sistema completo di gestione articoli con editor WYSIWYG, upload immagini, e pubblicazione.

### Giorno 1-2: Setup Base + TipTap Integration

**Installazione Dipendenze:**
```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-image @tiptap/extension-markdown
pnpm add @tiptap/extension-code-block-lowlight lowlight
```

**File da Creare (3):**

1. **`components/organisms/editor/rich-text-editor.tsx`** (300 righe)
   - TipTap wrapper component con toolbar
   - Markdown support
   - Code highlighting
   - Image paste/drop handlers
   - Mobile responsive
   ```typescript
   interface RichTextEditorProps {
     content: string;
     onChange: (content: string) => void;
     placeholder?: string;
     editable?: boolean;
   }
   ```

2. **`components/organisms/editor/editor-toolbar.tsx`** (150 righe)
   - Formatting buttons (bold, italic, heading, list, etc.)
   - Image upload button
   - Code block button
   - Link insertion
   - Mobile collapsible

3. **`app/actions/storage.ts`** (100 righe)
   - `uploadArticleImage(formData: FormData)` server action
   - Validates image (max 5MB, JPEG/PNG/WebP)
   - Uploads to Supabase Storage bucket `article-images`
   - Returns signed URL (1 year validity)
   - RLS: Only admins can upload

**Test:** Editor renders, toolbar works, local state updates

---

### Giorno 3-4: Articles CRUD Interface

**File da Creare (4):**

1. **`app/(admin)/admin/articles/articles-client.tsx`** (400 righe)
   - DataTable integration (riusa `components/admin/data-table.tsx`)
   - Columns: cover image, title, author, status, published_at, actions
   - Row actions: Edit, Delete, Publish/Unpublish, Preview
   - FilterPanel integration
   - Create button → ArticleFormDialog

2. **`components/admin/article-form-dialog.tsx`** (350 righe)
   - Dialog con form per create/edit
   - Campi: title, slug (auto-generated), excerpt, cover_image, status
   - RichTextEditor per content
   - ImageUpload per cover image
   - Auto-save draft ogni 30 secondi (localStorage)
   - Zod validation con `createArticleSchema`

3. **`components/admin/article-filters.tsx`** (80 righe)
   - FilterPanel wrapper
   - Filters: status (draft/published/archived), author, date range, search
   - Server action: `getArticlesFiltered(filters)` (nuovo in `app/actions/articles.ts`)

4. **`lib/utils/slug-generator.ts`** (50 righe)
   - `generateSlug(title: string): string`
   - Kebab-case transformation
   - Removes accents/special chars
   - Ensures uniqueness check against DB

**File da Modificare (2):**
- **`app/(admin)/admin/articles/page.tsx`** - Replace placeholder con ArticlesClient
- **`app/actions/articles.ts`** - Add `getArticlesFiltered()` function

**Test:** Can create article with rich content, slug auto-generates, filter works

---

### Giorno 5-6: Image Upload + Storage Integration

**Supabase Storage Setup:**

1. **Migration:** `supabase/migrations/00023_article_images_bucket.sql`
   ```sql
   INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

   CREATE POLICY "Admins can upload article images"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (
     bucket_id = 'article-images' AND
     (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'super_admin')
   );

   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT TO public
   USING (bucket_id = 'article-images');
   ```

2. **Deploy:**
   ```bash
   pnpm exec supabase db push
   ```

**Feature Implementation:**
- Rich text editor image upload → calls `uploadArticleImage()` → inserts signed URL
- Cover image upload → ImageUpload component → Supabase Storage
- Image preview in editor and card
- Image deletion (cleanup on article delete)

**Test:** Upload image in editor, upload cover image, both display correctly

---

### Giorno 7-8: Public Article Views

**File da Creare (3):**

1. **`app/(public)/articles/page.tsx`** (120 righe)
   - Server component
   - Calls `getPublishedArticles()` (già esiste in actions)
   - Grid/list layout
   - Pagination
   - Metadata per SEO

2. **`app/(public)/articles/[slug]/page.tsx`** (150 righe)
   - Server component
   - Calls `getArticleBySlug(slug)` (già esiste)
   - Article detail with cover image, content (rendered from markdown/HTML)
   - Author card
   - Published date
   - Metadata with Open Graph tags

3. **`components/molecules/article-card.tsx`** (100 righe)
   - Reusable card for article listings
   - Shows: cover image, title, excerpt, author, date, badge (status)
   - Click → navigate to `/articles/[slug]`

**File da Modificare (1):**
- **`lib/utils/constants.ts`** - Add `ARTICLES: '/articles'` route

**Test:** Published articles visible on `/articles`, detail page renders correctly

---

### Giorno 9-10: Polish + Testing

**Refinements:**
- Add excerpt auto-generation (first 150 chars from content)
- SEO metadata (title, description, og:image)
- Breadcrumbs navigation
- Mobile responsive testing
- Dark mode compatibility
- Accessibility audit (ARIA labels, keyboard navigation)

**End-to-End Testing:**
- [ ] Admin can create draft article
- [ ] Rich text editor supports bold, italic, headings, lists, code blocks
- [ ] Can upload images in editor and as cover
- [ ] Slug auto-generates and is unique
- [ ] Can publish article (status → published, published_at set)
- [ ] Published article visible on public `/articles` page
- [ ] Detail page renders correctly with all content
- [ ] Can edit and re-publish
- [ ] Can delete article (confirmation required)
- [ ] Filters work (status, author, date range, search)

**Deliverable:** Articles Management 100% complete

---

## SETTIMANA 3-4: USER DASHBOARD DETTAGLIATO (PRIORITÀ 2)

### Obiettivo
Creare dashboard dettagliato per singolo utente visibile da admin con timeline attività, statistiche, e gestione completa.

### Giorno 1-2: Server Actions + Activity Timeline

**File da Modificare (1):**

**`app/actions/users.ts`** - Add 2 new functions:

1. **`getUserDetailedProfile(userId: string)`** (80 righe)
   - Auth check: admin only
   - Query users table (all 32 fields)
   - Join with user_badges, user_points
   - Calculate level from points
   - Returns: `{ user, badges, points, level, error? }`

2. **`getUserActivityTimeline(userId: string, limit=50)`** (120 righe)
   - Auth check: admin only
   - Query 5 tables in parallel:
     - articles (author_id = userId) → "Published article"
     - marketplace_items → "Created/Sold listing"
     - event_rsvps → "RSVP'd to event"
     - professional_profiles → "Created profile"
     - user_badges → "Earned badge"
   - Combine arrays, sort by date DESC
   - Return unified timeline structure:
     ```typescript
     {
       type: 'article' | 'marketplace' | 'event' | 'profile' | 'badge',
       title: string,
       description: string,
       timestamp: Date,
       metadata?: Record<string, any>
     }[]
     ```

**Test:** Functions return correct data for test user

---

### Giorno 3-4: Timeline Components

**File da Creare (2):**

1. **`components/admin/timeline-item.tsx`** (100 righe)
   - Single activity entry component
   - Icon based on type (Article → FileText, Marketplace → ShoppingBag, etc.)
   - Timestamp (relative: "2 giorni fa")
   - Title + description
   - Optional metadata badge (e.g., "Sold for €50")
   ```typescript
   interface TimelineItemProps {
     type: ActivityType;
     title: string;
     description: string;
     timestamp: Date;
     metadata?: Record<string, any>;
   }
   ```

2. **`components/admin/activity-timeline.tsx`** (150 righe)
   - Container component
   - Props: `activities: Activity[]`
   - Vertical timeline with connecting lines
   - Empty state: "Nessuna attività registrata"
   - Load more button (if > 50 items)
   - Mobile responsive

**Test:** Timeline renders with mock data

---

### Giorno 5-7: User Detail Page

**File da Creare (2):**

1. **`app/(admin)/admin/users/[id]/page.tsx`** (100 righe)
   - Server component
   - Auth check → redirect if !admin
   - Get userId from params
   - Calls `getUserDetailedProfile(userId)`
   - Calls `getUserActivityTimeline(userId)`
   - Pass to UserDetailClient

2. **`app/(admin)/admin/users/[id]/user-detail-client.tsx`** (500 righe)
   - Client component (needs useState for tabs)
   - AdminPageLayout wrapper
   - Back button → `/admin/users`
   - Tabs: Overview | Activity | Content | Settings

   **Tab 1: Overview** (200 righe)
   - UserProfileCard (all 32 fields in grid)
   - StatsGrid (4 StatCards):
     - Total Points + Level progress bar
     - Badges Earned (count + icons)
     - Content Published (articles + marketplace + proposals)
     - Account Age (created_at → "Member for X days")
   - Quick Actions:
     - Edit Role button → Dialog
     - Verify/Reject button
     - Send Message button (future)
     - Delete User button (confirmation)

   **Tab 2: Activity** (100 righe)
   - ActivityTimeline component
   - Filter by type (All | Articles | Marketplace | Events | Badges)

   **Tab 3: Content** (150 righe)
   - Lists with links:
     - Published Articles (title, date, status)
     - Marketplace Listings (title, price, status)
     - Proposals (title, votes, status)
     - Service Profile (if exists)
   - Each item clickable → navigate to edit page

   **Tab 4: Settings** (50 righe)
   - Permissions JSONB editor (future)
   - Account status (active/inactive/banned)
   - Last sign-in timestamp

**File da Modificare (2):**
- **`lib/utils/constants.ts`** - Add `ADMIN_USER_DETAIL: '/admin/users/:id'`
- **`app/(admin)/admin/users/users-client.tsx`** - Add "Vedi Dettagli" row action (line 209-238)

**Test:** Can navigate from users list to detail page, all tabs load correctly

---

### Giorno 8-10: Polish + Integration

**Refinements:**
- Add user avatar display (large in profile card)
- Add verification badge if approved
- Add role badge with color coding
- Add "Last Active" timestamp
- Add export user data button (GDPR compliance)
- Mobile responsive testing

**Testing Checklist:**
- [ ] Detail page loads for any user ID
- [ ] Profile card shows all 32 fields correctly
- [ ] Stats calculate correctly
- [ ] Activity timeline shows recent actions
- [ ] Content tab lists all user's items
- [ ] Quick actions work (edit role, verify, delete)
- [ ] Navigation back to users list works
- [ ] Mobile layout usable

**Deliverable:** User Dashboard Dettagliato 100% complete

---

## SETTIMANA 5: MODERATION ADVANCED (PRIORITÀ 3)

### Obiettivo
Implementare assegnazione moderatori, metrics dashboard, e filtri avanzati nel sistema di moderazione.

### Giorno 1-2: Moderator Assignment

**Migration:**

**`supabase/migrations/00024_moderation_enhancements.sql`** (50 righe)
```sql
-- Fix 1: Add missing enum value
ALTER TYPE moderation_action_type ADD VALUE IF NOT EXISTS 'unassigned';

-- Fix 2: Add index for moderator queries
CREATE INDEX IF NOT EXISTS idx_moderation_queue_moderated_by
ON moderation_queue(moderated_by);

-- Fix 3: Populate previous_status and new_status in triggers (optional)
-- ...
```

**Deploy:**
```bash
pnpm exec supabase db push
```

**Server Action:**

**`app/actions/moderation.ts`** - Add function:

**`getAvailableModerators()`** (40 righe)
```typescript
export async function getAvailableModerators() {
  // Auth check: admin only
  // Query: SELECT id, name, avatar FROM users
  // WHERE (role IN ('admin','super_admin') OR admin_role='moderator')
  // AND tenant_id = current_user.tenant_id
  // ORDER BY name
  // Returns: { moderators: User[] }
}
```

**UI Component:**

**`components/molecules/moderation-list.tsx`** - Modify (lines 80-120):
- Add moderator dropdown in detail view (when status = 'pending')
- Calls `getAvailableModerators()` on load
- On change → calls `assignModerationItem(itemId, moderatorId)`
- Display "Assigned to: [name]" if already assigned

**Test:** Can assign/unassign moderators without database errors

---

### Giorno 3-4: Moderation Metrics

**Database Schema:**

**`supabase/migrations/00025_moderation_metrics.sql`** (80 righe)
```sql
CREATE TABLE moderation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  metric_date DATE NOT NULL,
  moderator_id UUID REFERENCES users(id),  -- NULL = team stats
  items_processed INT DEFAULT 0,
  items_approved INT DEFAULT 0,
  items_rejected INT DEFAULT 0,
  avg_time_minutes NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, metric_date, moderator_id)
);

CREATE INDEX idx_moderation_metrics_tenant_date
ON moderation_metrics(tenant_id, metric_date DESC);

CREATE INDEX idx_moderation_metrics_moderator
ON moderation_metrics(moderator_id);

-- Function to calculate metrics (called by Edge Function daily)
CREATE OR REPLACE FUNCTION calculate_moderation_metrics(p_date DATE)
RETURNS void AS $$
BEGIN
  -- Insert/update team stats
  INSERT INTO moderation_metrics (tenant_id, metric_date, moderator_id, ...)
  SELECT
    tenant_id,
    p_date,
    NULL as moderator_id,
    COUNT(*) FILTER (WHERE moderated_at::DATE = p_date) as items_processed,
    COUNT(*) FILTER (WHERE status = 'approved' AND moderated_at::DATE = p_date) as items_approved,
    COUNT(*) FILTER (WHERE status = 'rejected' AND moderated_at::DATE = p_date) as items_rejected,
    AVG(EXTRACT(EPOCH FROM (moderated_at - created_at))/60) FILTER (WHERE moderated_at::DATE = p_date) as avg_time_minutes
  FROM moderation_queue
  GROUP BY tenant_id
  ON CONFLICT (tenant_id, metric_date, moderator_id) DO UPDATE
  SET items_processed = EXCLUDED.items_processed, ...;

  -- Insert/update per-moderator stats
  INSERT INTO moderation_metrics (tenant_id, metric_date, moderator_id, ...)
  SELECT ... GROUP BY tenant_id, moderated_by
  ON CONFLICT ... DO UPDATE ...;
END;
$$ LANGUAGE plpgsql;
```

**Server Action:**

**`app/actions/moderation.ts`** - Add function:

**`getModerationMetrics(days=30)`** (60 righe)
- Auth check: admin only
- Query moderation_metrics table for last N days
- Aggregate: total processed, approval rate, avg time, backlog
- Returns chart data for visualization

**UI Component:**

**`components/admin/moderation-metrics-card.tsx`** (200 righe)
- Card with 4 StatCards:
  - Pending Backlog (count + trend)
  - Avg Moderation Time (minutes + trend)
  - Approval Rate (percentage + trend)
  - Items Processed (count + trend)
- Recharts line chart (last 30 days)
- Per-moderator leaderboard table

**Integration:**

**`app/(admin)/admin/moderation/page.tsx`** - Add metrics card above filters

**Test:** Metrics calculate correctly, chart displays data

---

### Giorno 5: Advanced Filters

**Server Action:**

**`app/actions/moderation.ts`** - Modify `getModerationQueue()` (lines 36-120):
- Add filter params: priority, dateRange, assignedTo, moderatedBy, search
- Build dynamic WHERE clauses

**UI Component:**

**`components/molecules/moderation-filters.tsx`** - Replace (complete rewrite, 200 righe):
- Use FilterPanel component (generic admin filter)
- Fields:
  1. Status: select (pending, in_review, approved, rejected)
  2. Item Type: select (marketplace, professional_profile, proposal, etc.)
  3. Priority: select (low, medium, high, urgent)
  4. Date Range: date-range (created_at or moderated_at)
  5. Assigned To: select (load moderators)
  6. Moderated By: select (load moderators)
  7. Search: text (item_title, item_creator_name)

**Integration:**
- FilterPanel passes filters to server via searchParams
- Server action filters results
- Client displays filtered list

**Test:** All 7 filters work individually and in combination

---

## SETTIMANA 6: CRITICAL SECURITY + POLISH

### Giorno 1-3: Audit Logging System

**Database Schema:**

**`supabase/migrations/00026_audit_log.sql`** (100 righe)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),  -- NULL for system actions
  action_type VARCHAR(100) NOT NULL,  -- 'user.role.updated', 'article.published', etc.
  resource_type VARCHAR(50) NOT NULL,  -- 'user', 'article', 'moderation', etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);

-- RLS: Admins only
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_select" ON audit_log FOR SELECT
USING (is_admin() AND tenant_id = get_user_tenant_id());
```

**Server Action:**

**`app/actions/audit.ts`** (NEW FILE, 150 righe)

```typescript
'use server';

export async function logAuditEvent(params: {
  actionType: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_log').insert({
    user_id: user?.id,
    tenant_id: await getUserTenantId(),
    ...params,
    ip_address: headers().get('x-forwarded-for') || headers().get('x-real-ip'),
    user_agent: headers().get('user-agent'),
  });
}

export async function getAuditLog(filters: {
  userId?: string;
  resourceType?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // Query with filters, return paginated results
}
```

**Integration:**
- Modify all admin server actions to call `logAuditEvent()` after mutations
- Examples: `updateUserRole()`, `updateArticle()`, `assignModerationItem()`

**UI Component:**

**`app/(admin)/admin/audit/page.tsx`** (NEW, 200 righe)
- DataTable with audit log entries
- FilterPanel (user, resource type, action type, date range)
- Export to CSV button
- Detail modal showing old/new values diff

**Test:** Audit events logged correctly, can filter and view in admin panel

---

### Giorno 4-5: GDPR Data Export

**Server Action:**

**`app/actions/users.ts`** - Add function:

**`exportUserData(userId: string)`** (150 righe)
```typescript
export async function exportUserData(userId: string) {
  // Auth check: admin OR userId === current user
  // Query all tables where user has data:
  // - users (profile)
  // - articles
  // - marketplace_items
  // - event_rsvps
  // - professional_profiles
  // - user_badges
  // - user_points
  // - reviews (as reviewer)
  // - moderation_queue (as reporter)
  // Compile into JSON object
  // Return: { data: object, error?: string }
}
```

**API Route:**

**`app/api/export-user-data/[userId]/route.ts`** (NEW, 80 righe)
```typescript
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { data, error } = await exportUserData(params.userId);
  if (error) return NextResponse.json({ error }, { status: 403 });

  // Return JSON file download
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="user-data-${params.userId}.json"`,
    },
  });
}
```

**UI Integration:**
- Add "Export Data" button in User Detail page (Settings tab)
- Download JSON file with all user data

**Test:** Export works, JSON contains all user data, complies with GDPR

---

### Giorno 6-7: Rate Limiting + Security

**Implementation:**

1. **Rate Limiting Middleware** (use `@upstash/ratelimit` or custom)
   - Limit admin actions: 100 requests/hour per user
   - Limit moderation actions: 200 requests/hour per user
   - Limit article creation: 10 articles/hour per user

2. **CSRF Protection** (Next.js built-in, verify enabled)

3. **Input Sanitization**
   - Ensure all Zod schemas sanitize HTML (use DOMPurify if needed)
   - Validate all file uploads (type, size, content)

4. **Security Headers** (add to `next.config.js`)
   ```javascript
   headers: [
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
     { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
   ]
   ```

**Test:** Rate limits work, security headers present

---

## SETTIMANA 7-8: DASHBOARD ANALYTICS + FINAL POLISH

### Giorno 1-3: Dashboard Enhancements

**File da Creare (2):**

1. **`components/admin/dashboard-charts.tsx`** (300 righe)
   - Recharts integration
   - 4 charts:
     - User Registrations (line chart, last 30 days)
     - Content Published (bar chart, by type)
     - Moderation Activity (area chart, pending vs processed)
     - Engagement Metrics (combo chart, views + interactions)

2. **`app/actions/admin-dashboard.ts`** (NEW, 200 righe)
   - `getDashboardChartData(metric: string, days: number)`
   - Queries aggregated_stats table
   - Returns formatted data for charts

**Integration:**

**`app/(admin)/admin/dashboard/page.tsx`** - Modify:
- Add DashboardCharts component below stats grid
- Add date range selector (7 days, 30 days, 90 days)
- Add refresh button

**Test:** Charts render correctly with real data

---

### Giorno 4-5: Bulk Operations Integration

**Goal:** Integrate existing BulkActionsToolbar component

**Files da Modificare (3):**

1. **`app/(admin)/admin/users/users-client.tsx`**
   - Add row selection checkboxes to DataTable
   - Add BulkActionsToolbar with actions:
     - Bulk Verify (approved)
     - Bulk Reject (rejected)
     - Bulk Delete (confirmation)
   - State: `selectedRows: string[]`

2. **`app/(admin)/admin/articles/articles-client.tsx`**
   - Add BulkActionsToolbar with actions:
     - Bulk Publish
     - Bulk Archive
     - Bulk Delete

3. **`app/(admin)/admin/moderation/page.tsx`**
   - Add BulkActionsToolbar with actions:
     - Bulk Approve
     - Bulk Reject
     - Bulk Assign to Moderator

**Server Actions:**

**`app/actions/admin.ts`** - Add bulk functions (3):
- `bulkUpdateUserVerification(userIds: string[], status: string)`
- `bulkUpdateArticleStatus(articleIds: string[], status: string)`
- `bulkUpdateModerationStatus(itemIds: string[], status: string)`

**Test:** Can select multiple items, bulk actions work correctly

---

### Giorno 6-7: Mobile Optimization

**Areas to Test/Fix:**
- [ ] Articles editor usable on mobile (toolbar, formatting)
- [ ] User detail page responsive (tabs stack)
- [ ] Moderation filters work in bottom sheet (mobile)
- [ ] DataTable columns hide appropriately on mobile
- [ ] All dialogs/sheets work on mobile
- [ ] Touch targets 44x44px minimum
- [ ] No horizontal scroll

**File da Modificare:** Various (fix responsive classes)

---

### Giorno 8-10: Final Testing + Documentation

**End-to-End Testing Checklist:**

**Articles Management:**
- [ ] Create article with rich content
- [ ] Upload images in editor and as cover
- [ ] Publish article
- [ ] Edit published article
- [ ] Archive article
- [ ] Delete article
- [ ] Filter by status, author, date
- [ ] Search articles by title/content
- [ ] View public article page
- [ ] Mobile: Editor usable

**User Dashboard:**
- [ ] View user detail from list
- [ ] All 32 fields display correctly
- [ ] Activity timeline shows recent actions
- [ ] Content tab lists user's items
- [ ] Edit user role
- [ ] Verify/reject user
- [ ] Delete user (with confirmation)
- [ ] Export user data (GDPR)
- [ ] Mobile: Tabs work

**Moderation Advanced:**
- [ ] Assign item to moderator
- [ ] Unassign item
- [ ] Metrics display correctly
- [ ] Filter by all 7 criteria
- [ ] Multiple filters combine correctly
- [ ] Bulk approve items
- [ ] Bulk reject items
- [ ] Mobile: Filters in bottom sheet

**Security:**
- [ ] Audit log records all admin actions
- [ ] Can view audit log in admin panel
- [ ] Rate limiting works (test 100+ requests)
- [ ] GDPR export includes all user data
- [ ] Security headers present

**Performance:**
- [ ] Admin pages load < 2 seconds
- [ ] DataTable pagination works with 1000+ records
- [ ] Charts render smoothly
- [ ] Image uploads < 5 seconds
- [ ] No memory leaks (test with 100+ actions)

**Documentation to Create:**

1. **`ADMIN_PANEL_USER_GUIDE.md`** (150 righe)
   - How to manage articles (create, edit, publish)
   - How to manage users (verify, roles, detail view)
   - How to moderate content (assign, metrics, filters)
   - How to view audit logs
   - How to export user data (GDPR)

2. **`ADMIN_PANEL_TECHNICAL_DOCS.md`** (200 righe)
   - Architecture overview
   - Component inventory
   - Server actions reference
   - Database schema changes
   - Security implementation
   - Troubleshooting guide

---

## EFFORT ESTIMATES SUMMARY

| Week | Feature | Developer Days | Completion % |
|------|---------|----------------|--------------|
| 1-2 | Articles Management | 10 days | 0% → 100% |
| 3-4 | User Dashboard | 10 days | 30% → 100% |
| 5 | Moderation Advanced | 5 days | 60% → 95% |
| 6 | Security (Audit + GDPR) | 5 days | 0% → 90% |
| 7-8 | Dashboard + Polish | 10 days | 60% → 95% |

**Total:** 40 developer days (8 settimane x 5 giorni)

**Contingency:** +10 giorni per bug fixing, edge cases, testing

**Real Timeline:** 8-10 settimane (con 1 developer full-time)

---

## DEPENDENCIES & RISKS

### Dependencies

1. **Week 1-2 (Articles)** → Blocca:
   - Public article views (Week 2)
   - User activity timeline (Week 3 - "Published article" entries)

2. **Week 5 (Moderation)** → Blocca:
   - Moderation metrics (requires moderator assignment)
   - Bulk moderation actions

3. **Week 6 (Audit Log)** → Blocca:
   - User detail "Settings" tab (audit history)
   - Admin compliance reporting

### Risks

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| TipTap learning curve | MEDIA | ALTO | Start with basic features, expand gradually |
| Supabase Storage issues | BASSA | MEDIO | Test upload/delete early, have fallback URLs |
| Performance con 1000+ articles | MEDIA | MEDIO | Implement pagination, lazy loading, indexes |
| Moderation metrics calcoli lenti | BASSA | BASSO | Use aggregated_stats, pre-calculate daily |
| Rate limiting complesso | MEDIA | BASSO | Use proven library (@upstash/ratelimit) |
| GDPR compliance gaps | BASSA | ALTO | Legal review before launch, test export |

---

## SUCCESS CRITERIA

### Quantitative

- ✅ Articles management: 0% → 100% (10 features implemented)
- ✅ User dashboard: 30% → 100% (detail page + timeline + 32 fields)
- ✅ Moderation: 60% → 95% (assignment + metrics + 7 filters)
- ✅ Security: 0% → 90% (audit log + GDPR export + rate limiting)
- ✅ Dashboard: 60% → 95% (charts + analytics + bulk actions)
- ✅ Overall admin panel: 55/100 → 95/100 (40-point improvement)

### Qualitative

- ✅ Admin can manage articles without technical knowledge
- ✅ Admin can view complete user history and activity
- ✅ Moderators can efficiently process queue with metrics
- ✅ Audit trail exists for all critical actions
- ✅ GDPR compliance (user data export)
- ✅ Mobile-friendly admin interface
- ✅ Consistent UX across all admin pages
- ✅ Comprehensive documentation for administrators

---

## POST-COMPLETION (WEEK 9+)

### Nice-to-Have Features (P3 Priority)

1. **Notifications System** (2-3 weeks)
   - Real-time notifications for admins
   - Moderation queue alerts
   - New user registrations
   - System events

2. **Advanced Analytics** (1-2 weeks)
   - Google Analytics integration
   - Custom event tracking
   - Funnel analysis
   - A/B testing framework

3. **Media Library** (1-2 weeks)
   - Central image management
   - Image optimization
   - CDN integration
   - Usage tracking

4. **Email Templates** (1 week)
   - Visual email editor
   - Template variables
   - Preview system
   - A/B testing

5. **API Rate Limiting Dashboard** (1 week)
   - Real-time monitoring
   - Alert thresholds
   - Blocked IPs management

---

## FILE CHANGES SUMMARY

### Files to Create (35)

**Components (15):**
- components/organisms/editor/rich-text-editor.tsx
- components/organisms/editor/editor-toolbar.tsx
- components/admin/article-form-dialog.tsx
- components/admin/article-filters.tsx
- components/molecules/article-card.tsx
- components/admin/timeline-item.tsx
- components/admin/activity-timeline.tsx
- components/admin/moderation-metrics-card.tsx
- components/admin/dashboard-charts.tsx
- (+ 6 utility components)

**Pages (10):**
- app/(public)/articles/page.tsx
- app/(public)/articles/[slug]/page.tsx
- app/(admin)/admin/articles/articles-client.tsx
- app/(admin)/admin/users/[id]/page.tsx
- app/(admin)/admin/users/[id]/user-detail-client.tsx
- app/(admin)/admin/audit/page.tsx
- app/api/export-user-data/[userId]/route.ts
- (+ 3 supporting pages)

**Actions (3):**
- app/actions/storage.ts
- app/actions/audit.ts
- app/actions/admin-dashboard.ts

**Migrations (4):**
- supabase/migrations/00023_article_images_bucket.sql
- supabase/migrations/00024_moderation_enhancements.sql
- supabase/migrations/00025_moderation_metrics.sql
- supabase/migrations/00026_audit_log.sql

**Utilities (3):**
- lib/utils/slug-generator.ts
- (+ 2 helper files)

### Files to Modify (12)

- app/(admin)/admin/articles/page.tsx (replace placeholder)
- app/actions/articles.ts (add getArticlesFiltered)
- app/actions/users.ts (add 3 functions)
- app/actions/moderation.ts (add 3 functions, fix enum bug)
- app/actions/admin.ts (add 3 bulk functions)
- app/(admin)/admin/users/users-client.tsx (add "Vedi Dettagli" action)
- app/(admin)/admin/dashboard/page.tsx (add charts)
- components/molecules/moderation-list.tsx (add moderator dropdown)
- components/molecules/moderation-filters.tsx (complete rewrite)
- lib/utils/constants.ts (add 2 routes)
- next.config.js (add security headers)
- package.json (add TipTap dependencies)

---

## NEXT STEPS

### Immediate Actions (Week 1 - Giorni 1-2)

1. **Review this roadmap** with team/stakeholders
2. **Install TipTap** dependencies
3. **Create article images bucket** in Supabase Storage
4. **Start building** RichTextEditor component
5. **Test editor locally** with mock data

### Questions to Answer Before Starting

1. **TipTap Extensions:** Need collaborative editing (Yjs)? → Decide now (affects architecture)
2. **Image Storage:** Max file size? Image optimization? → Configure early
3. **Moderation Metrics:** Calculate real-time or batch (daily)? → Affects performance
4. **Audit Log:** Retention policy (30/90/365 days)? → Legal/compliance requirement
5. **GDPR Export:** JSON only or PDF option? → User expectation

---

**Prepared by:** Claude (AI Assistant)
**Date:** Gennaio 2025
**Version:** 1.0
**Status:** Ready for Implementation
