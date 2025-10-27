# Testing Guide - Architectural Refactoring

## Overview

This guide covers the comprehensive architectural changes made to the Prato Rinaldo platform, including:
- Renamed professionals to service_profiles with volunteer/professional distinction
- Conditional navigation based on authentication status
- Permission restructuring for events, marketplace, Agorà, and Risorse
- New bacheca system (personal dashboard + public feed)

---

## 1. Database Migrations

### Apply Migrations

Run the following command to apply all migrations:

```bash
npx supabase db push
```

Or if using remote database:

```bash
pnpm supabase db push
```

### Migrations Applied

1. **00010_rename_professionals_to_services.sql**
   - Renames `professional_profiles` → `service_profiles`
   - Adds `profile_type` enum: 'volunteer' | 'professional'
   - Renames `hourly_rate` → `rate_or_reimbursement`
   - Creates index on `profile_type`

2. **00011_update_service_profiles_rls.sql**
   - Updates Row Level Security policies for renamed table

3. **00012_add_is_private_marketplace.sql**
   - Adds `is_private` boolean to `marketplace_items`
   - Creates index for efficient filtering

### Verify Migrations

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'service_profiles'
);

-- Check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_profiles';

-- Check marketplace is_private column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'marketplace_items' AND column_name = 'is_private';
```

---

## 2. Manual Testing Checklist

### Test Matrix

| Feature | Visitors | Registered | Verified |
|---------|----------|------------|----------|
| Home page | ✓ | ✓ | ✓ |
| Eventi (public) | ✓ | ✓ | ✓ |
| Eventi (private) | ✗ | ✓ | ✓ |
| Marketplace (public) | ✓ | ✓ | ✓ |
| Marketplace (private) | ✗ | ✓ | ✓ |
| Community Pro | ✓ | ✓ | ✓ |
| Agorà | ✗ | ✗ | ✓ |
| Risorse | ✗ | ✗ | ✓ |
| Bacheca personale | ✗ | ✓ | ✓ |
| Feed pubblico | ✓ | ✓ | ✓ |

### A. Visitor Testing (Not Logged In)

#### Navigation Check
- [ ] Header shows only 4 items: Home, Eventi, Marketplace, Community Pro
- [ ] No Agorà link visible
- [ ] No Risorse link visible
- [ ] "Accedi" and "Registrati" buttons visible

#### Eventi Page
- [ ] Navigate to `/events`
- [ ] Only public events are visible
- [ ] Private events are hidden
- [ ] Can view event details for public events

#### Marketplace Page
- [ ] Navigate to `/marketplace`
- [ ] Only public marketplace items visible
- [ ] Private items are hidden
- [ ] Can view item details for public items

#### Community Pro Page
- [ ] Navigate to `/community-pro`
- [ ] Page loads successfully
- [ ] Two tabs visible: Volontari | Professionisti
- [ ] Volunteers tab shows green badges
- [ ] Professionals tab shows blue badges
- [ ] Volunteers show "Rimborso: X€"
- [ ] Professionals show "Tariffa: X€/ora"

#### Feed Page
- [ ] Navigate to `/feed`
- [ ] Stats cards show: Eventi in Programma, Annunci Marketplace, Community Attiva
- [ ] Recent events visible (public only)
- [ ] Recent marketplace items visible (public only)
- [ ] CTA section encouraging registration

#### Protected Pages
- [ ] Try to access `/bacheca` → should redirect to login
- [ ] Try to access `/agora` → should redirect to login
- [ ] Try to access `/resources` → should redirect to login

### B. Registered User Testing (Logged In, NOT Verified)

#### Navigation Check
- [ ] Header shows 6 items: Home, Eventi, Marketplace, Community Pro, Agorà, Risorse
- [ ] All nav items visible
- [ ] User avatar/name visible in header
- [ ] "Esci" button visible

#### Login Redirect
- [ ] After login, user is redirected to `/bacheca` (NOT home page)
- [ ] Bacheca shows welcome message with user name
- [ ] Verification status badge shows "Verifica in corso"

#### Eventi Page
- [ ] Navigate to `/events`
- [ ] Both public AND private events visible
- [ ] Private events show "Privato" badge
- [ ] Can view all event details

#### Marketplace Page
- [ ] Navigate to `/marketplace`
- [ ] Both public AND private items visible
- [ ] Can view all item details

#### Bacheca Personale
- [ ] Navigate to `/bacheca`
- [ ] Welcome section shows user name and avatar
- [ ] Badge shows "Verifica in corso" (yellow/orange)
- [ ] CTA card visible: "Completa la verifica"
- [ ] Quick links grid shows 6 cards
- [ ] Agorà and Risorse cards are grayed out (disabled)
- [ ] Recent activity section shows events and marketplace items
- [ ] Counts in quick links are accurate

#### Agorà Access
- [ ] Navigate to `/agora`
- [ ] Should see VerificationRequired component
- [ ] Message: "L'Agorà è riservata ai residenti verificati..."
- [ ] "Vai al Profilo" button visible
- [ ] Should NOT see proposal list

#### Risorse Access
- [ ] Navigate to `/resources`
- [ ] Should see VerificationRequired component
- [ ] Message about verification requirement
- [ ] "Vai al Profilo" button visible

### C. Verified User Testing (Logged In, Verified Resident)

#### Bacheca Personale
- [ ] Navigate to `/bacheca`
- [ ] Badge shows "Verificato" (green)
- [ ] NO CTA card for verification
- [ ] All quick links are enabled (none grayed out)
- [ ] Can click Agorà and Risorse links

#### Agorà Access
- [ ] Navigate to `/agora`
- [ ] Should see full proposal list
- [ ] Tabs: Tutte, Bozze, In Votazione, Approvate, Respinte
- [ ] "Nuova Proposta" button visible
- [ ] Can view proposal details
- [ ] Can create new proposals

#### Risorse Access
- [ ] Navigate to `/resources`
- [ ] Should see full resources list
- [ ] Tabs: Tutti, Documenti, Tutorial
- [ ] Can access all resources

#### Full Access Verification
- [ ] All features accessible
- [ ] No disabled links in bacheca
- [ ] Can participate in Agorà voting
- [ ] Can request tutorials in Risorse

---

## 3. URL Testing Matrix

### Public URLs (Always Accessible)
```
http://localhost:3000/
http://localhost:3000/events
http://localhost:3000/marketplace
http://localhost:3000/community-pro
http://localhost:3000/community-pro?type=volunteer
http://localhost:3000/community-pro?type=professional
http://localhost:3000/feed
http://localhost:3000/login
http://localhost:3000/register
```

### Protected URLs (Registered Users)
```
http://localhost:3000/bacheca
http://localhost:3000/profile
```

### Protected URLs (Verified Residents Only)
```
http://localhost:3000/agora
http://localhost:3000/agora/new
http://localhost:3000/agora/roadmap
http://localhost:3000/resources
http://localhost:3000/resources?tab=documents
http://localhost:3000/resources?tab=tutorials
```

---

## 4. Database State Verification

### Check Service Profiles

```sql
-- Count volunteers vs professionals
SELECT
  profile_type,
  COUNT(*) as count
FROM service_profiles
WHERE status = 'approved'
GROUP BY profile_type;

-- View sample profiles
SELECT
  id,
  name,
  profile_type,
  rate_or_reimbursement,
  category,
  status
FROM service_profiles
LIMIT 5;
```

### Check Private Events/Marketplace

```sql
-- Count public vs private events
SELECT
  is_private,
  COUNT(*) as count
FROM events
WHERE status = 'published'
GROUP BY is_private;

-- Count public vs private marketplace
SELECT
  is_private,
  COUNT(*) as count
FROM marketplace_items
WHERE status = 'approved' AND is_sold = false
GROUP BY is_private;
```

### Check User Verification Status

```sql
-- Count users by verification status
SELECT
  verification_status,
  COUNT(*) as count
FROM users
GROUP BY verification_status;
```

---

## 5. Expected Behaviors

### Navigation Visibility
- **Visitors**: 4 nav items (Home, Eventi, Marketplace, Community Pro)
- **Registered**: 6 nav items (+ Agorà, Risorse)
- **Verified**: Full access to all features

### Content Filtering
- **Events**: Public events visible to all, private events only to registered users
- **Marketplace**: Public items visible to all, private items only to registered users
- **Community Pro**: Visible to all, searchable/filterable by type

### Access Control
- **Agorà**: Only verified residents can view and participate
- **Risorse**: Only verified residents can access
- **Bacheca Personale**: Only logged-in users can access

### Login Flow
1. User clicks "Accedi"
2. Enters credentials
3. Redirects to `/bacheca` (NOT home)
4. Sees personalized dashboard

---

## 6. Known Issues & Gotchas

### Issue 1: Existing Professional Profiles
**Problem**: Existing `professional_profiles` need migration to `service_profiles`

**Solution**: Migration 00010 handles table rename automatically. All existing profiles will default to `profile_type = 'professional'`

**Action Required**: Manually update profiles that should be volunteers:
```sql
UPDATE service_profiles
SET profile_type = 'volunteer'
WHERE id IN ('volunteer-id-1', 'volunteer-id-2');
```

### Issue 2: Existing Marketplace Items
**Problem**: Existing marketplace items don't have `is_private` set

**Solution**: Migration 00012 adds field with `DEFAULT false`, so all existing items are public

**Action Required**: Manually mark items as private if needed:
```sql
UPDATE marketplace_items
SET is_private = true
WHERE id IN ('item-id-1', 'item-id-2');
```

### Issue 3: Header Caching
**Problem**: Header might not immediately show new nav items after login

**Solution**: Next.js should revalidate automatically. If issue persists:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check that `app/(public)/layout.tsx` is async and fetching user

### Issue 4: Verification Status
**Problem**: Users stuck in "pending" verification

**Action Required**: Admin must approve via admin panel or direct SQL:
```sql
UPDATE users
SET verification_status = 'approved'
WHERE id = 'user-id' AND verification_status = 'pending';
```

---

## 7. Files Changed Summary

### Database Migrations (3 files)
- `supabase/migrations/00010_rename_professionals_to_services.sql` - NEW
- `supabase/migrations/00011_update_service_profiles_rls.sql` - NEW
- `supabase/migrations/00012_add_is_private_marketplace.sql` - NEW

### Configuration (1 file)
- `lib/utils/constants.ts` - Added COMMUNITY_PRO, FEED, BACHECA routes + SERVICE_PROFILE_TYPE enum

### Server Actions (4 files)
- `app/actions/service-profiles.ts` - Renamed from professionals.ts, added profile type filtering
- `app/actions/events.ts` - Added getAllEvents() with conditional is_private filter
- `app/actions/marketplace.ts` - Updated getApprovedItems() with conditional is_private filter
- `app/actions/auth.ts` - Changed redirect from HOME to BACHECA

### Components (3 files)
- `components/organisms/header/header.tsx` - Made conditional, accepts user prop
- `components/organisms/footer/footer.tsx` - Updated Community Pro link
- `components/molecules/verification-required.tsx` - NEW reusable protection component

### Layouts (1 file)
- `app/(public)/layout.tsx` - Made async, fetches user, passes to Header

### Pages (5 files)
- `app/(public)/page.tsx` - Updated Community Pro link
- `app/(public)/community-pro/page.tsx` - Complete rewrite with volunteer/professional tabs
- `app/(public)/agora/page.tsx` - Added verification check
- `app/(private)/bacheca/page.tsx` - NEW personal dashboard
- `app/(public)/feed/page.tsx` - NEW public feed

**Total Files Changed: 17**
- 3 NEW migrations
- 1 NEW component
- 2 NEW pages
- 11 MODIFIED files

---

## 8. Rollback Instructions

If issues arise and rollback is needed:

### Rollback Database
```bash
# Find current migration version
npx supabase migration list

# Rollback to before 00010
npx supabase db reset

# Re-apply migrations up to 00009
npx supabase db push --include-all --exclude 00010,00011,00012
```

### Rollback Code
```bash
# Revert to previous commit
git log --oneline  # Find commit hash before changes
git revert <commit-hash>

# Or reset hard (destroys changes)
git reset --hard <commit-hash>
```

---

## 9. Performance Considerations

### Database Indexes
- `idx_service_profiles_type` - Speeds up volunteer/professional filtering
- `idx_marketplace_is_private` - Speeds up public/private filtering
- Existing indexes on `tenant_id`, `status` still apply

### Query Optimization
- Events query adds `.eq('is_private', false)` for visitors (indexed)
- Marketplace query adds `.eq('is_private', false)` for visitors (indexed)
- Service profiles query adds `.eq('profile_type', 'volunteer')` for tab filtering (indexed)

### Caching Strategy
- Server Actions use `revalidatePath()` after mutations
- Static pages cached by Next.js
- User context fetched on every request (necessary for auth)

---

## 10. Future Enhancements

### Deferred Features (User Explicitly Requested Later)
1. **Sponsors System**
   - Separate from professionals and volunteers
   - Can be outside Prato Rinaldo (San Cesareo/Zagarolo businesses)
   - Research competitor platforms for integration patterns

2. **Agorà Pages**
   - Complete new proposal page
   - Complete proposal detail page
   - Complete roadmap visualization
   - Admin categories management

### Recommended Improvements
1. **Email Notifications**
   - Notify users when verification status changes
   - Notify about new private events/marketplace items

2. **Search & Filters**
   - Add search to Community Pro
   - Add category filters to all sections
   - Add date range filters to events

3. **Analytics**
   - Track page views by user type (visitor/registered/verified)
   - Track conversion from visitor to registered
   - Track verification completion rate

4. **Mobile Optimization**
   - Test navigation on mobile
   - Ensure tabs work on touch devices
   - Optimize bacheca layout for small screens

---

## 11. Testing Checklist Summary

### Phase 1: Database
- [ ] Migrations applied successfully
- [ ] Tables renamed correctly
- [ ] New columns exist
- [ ] Indexes created
- [ ] RLS policies updated

### Phase 2: Visitor Testing
- [ ] Navigation shows 4 items
- [ ] Only public events visible
- [ ] Only public marketplace visible
- [ ] Community Pro accessible
- [ ] Feed accessible
- [ ] Protected pages redirect to login

### Phase 3: Registered User Testing
- [ ] Navigation shows 6 items
- [ ] Login redirects to /bacheca
- [ ] All events visible (public + private)
- [ ] All marketplace items visible (public + private)
- [ ] Agorà shows verification wall
- [ ] Risorse shows verification wall

### Phase 4: Verified User Testing
- [ ] Full access to Agorà
- [ ] Full access to Risorse
- [ ] No disabled links in bacheca
- [ ] Verification badge shows "Verificato"

### Phase 5: Community Pro Testing
- [ ] Volunteer tab works
- [ ] Professional tab works
- [ ] Query param ?type= works
- [ ] Badges show correct colors
- [ ] Rates display correctly

### Phase 6: Integration Testing
- [ ] Login → Bacheca → Agorà flow
- [ ] Registration → Onboarding → Verification flow
- [ ] Create event → View in feed flow
- [ ] Create marketplace item → View in feed flow

---

## Contact & Support

If issues arise during testing:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migrations applied: `npx supabase migration list`
4. Check environment variables are set correctly
5. Try hard refresh (Ctrl+Shift+R)

**Testing completed by**: [Date]
**Tested by**: [Name]
**Environment**: [Development/Staging/Production]
**Browser(s)**: [Chrome/Firefox/Safari/Edge]
**Database**: [Local/Remote]

---

## Changelog

### Version 1.0.0 - 2025-01-27

**Added**
- Service profiles system with volunteer/professional distinction
- Conditional navigation based on authentication status
- Personal bacheca at `/bacheca`
- Public feed at `/feed`
- Verification-required component for protected pages
- is_private flag for marketplace items

**Changed**
- Renamed professionals → service_profiles
- Renamed hourly_rate → rate_or_reimbursement
- Moved Agorà and Risorse to registered-only navigation
- Login redirect now goes to `/bacheca` instead of home
- Events/Marketplace now filter by is_private based on auth status

**Removed**
- Agorà link from public header
- Risorse link from public header
- Old professionals route and components

**Fixed**
- Permission model now correctly implements three-tier access
- Header now shows appropriate nav items per user type
- Private content properly hidden from visitors
