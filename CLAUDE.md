# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prato Rinaldo Community Platform** is a Next.js 16 multi-tenant community management system for the Prato Rinaldo Residents Committee (frazione between San Cesareo and Zagarolo, Rome). Built with App Router, React 19, Supabase, and TypeScript.

**Tech Stack:**
- Next.js 16.0.0 (App Router, Turbopack, Cache Components, PPR)
- React 19.0.0 with Server Components
- TypeScript 5.7.2
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Tailwind CSS 4.1.14 + shadcn/ui (New York style)
- Server Actions (zero-config API)
- Zod 3.25.76 validation
- pnpm 10.4.1 package manager

**Project Scale:**
- 51 pages across 6 route groups
- 128 React components
- 19 server action files
- 29 database migrations
- 4 Supabase Edge Functions

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm type-check             # TypeScript validation
pnpm lint                   # ESLint
pnpm format                 # Prettier formatting

# Supabase
pnpm supabase:start         # Start local Supabase
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:reset         # Reset local database
pnpm supabase:gen-types     # Generate TypeScript types from schema

# Docker
pnpm docker:build           # Build Docker image
pnpm docker:up              # Start containers
pnpm docker:down            # Stop containers

# Supabase Edge Functions (deploy from project root)
pnpm exec supabase functions deploy <function-name>
```

## Supabase CLI Guardrails

**CRITICAL:** When executing Supabase CLI commands, Claude MUST ALWAYS use the pnpm wrapper commands or `pnpm exec supabase` to ensure compatibility with the project's dependency management.

### ✅ CORRECT - Always use these approaches:

```bash
# Option 1: Use pnpm script aliases (PREFERRED)
pnpm supabase:start         # Start local Supabase
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:reset         # Reset local database
pnpm supabase:gen-types     # Generate TypeScript types

# Option 2: Use pnpm exec for other supabase commands
pnpm exec supabase functions deploy <function-name>
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push
pnpm exec supabase db pull
pnpm exec supabase migration new <migration-name>
pnpm exec supabase migration list
```

### ❌ WRONG - Never use these:

```bash
# DO NOT use direct supabase command
supabase start
supabase functions deploy <function-name>
supabase db push

# DO NOT use hardcoded node_modules paths
node_modules/.pnpm/supabase@1.226.4/node_modules/supabase/bin/supabase.exe functions deploy

# DO NOT use npx supabase
npx supabase functions deploy
```

### Why This Matters

- **pnpm workspace consistency:** The project uses pnpm, not npm/yarn. Direct commands bypass the workspace resolver.
- **Version pinning:** Using `pnpm exec` ensures the exact version specified in `pnpm-lock.yaml` is used.
- **Portability:** Direct paths break across different setups; pnpm scripts work everywhere.
- **Maintainability:** When Supabase is updated, scripts in `package.json` are updated, not hardcoded paths.
- **CI/CD compatibility:** Automated pipelines rely on pnpm commands for consistency.

## Critical Architecture Patterns

### 1. Next.js 16 Server/Client Component Separation

**IMPORTANT:** Next.js 16 + Turbopack requires `'use client'` directive at the top of files. You **cannot** mix Server and Client Components in the same file.

**Pattern for Layouts:**
```
app/(route-group)/
  ├── layout.tsx              # Sync wrapper with Suspense
  ├── layout-content.tsx      # Async Server Component (DB queries, auth)
  └── *-layout-client.tsx     # Client Component (hooks, interactivity)
```

### 1a. Async Layouts & Suspense Boundaries (CRITICAL)

**⚠️ COMMON ERROR:** Next.js 16 + Turbopack generates "Uncached data accessed outside of Suspense" when layouts call `cookies()` or `headers()` directly.

**❌ PATTERN ERRATO (causes runtime error):**
```tsx
// layout.tsx - WRONG
export default async function Layout({ children }) {
  const supabase = await createClient(); // ❌ Error: cookies() without Suspense
  const { data: { user } } = await supabase.auth.getUser();
  return <Header user={user} />{children};
}
```

**✅ CORRECT PATTERN (Layout + Suspense + Content Component):**
```tsx
// layout.tsx - CORRECT (sync, no async)
import { Suspense } from 'react';
import { LoadingHeader } from '@/components/organisms/layout/loading-header';
import { LayoutContent } from './layout-content';
import { ConditionalFooter } from '@/components/organisms/footer/conditional-footer';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LoadingHeader />}>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
      <ConditionalFooter />
    </div>
  );
}
```

```tsx
// layout-content.tsx - CORRECT (async Server Component)
import { connection } from 'next/server';
import { getCachedUser } from '@/lib/auth/cached-user';
import { Header } from '@/components/organisms/header/header';
import { LayoutClient } from './layout-client';

export async function LayoutContent({ children }) {
  await connection(); // Force dynamic rendering - MUST be first
  const user = await getCachedUser(); // ✅ OK: inside Suspense boundary

  const userWithVerification = user ? {
    id: user.id,
    name: user.user_metadata?.name || user.email,
    email: user.email,
    avatar: user.avatar,
  } : null;

  return (
    <>
      <Header user={userWithVerification} />
      <LayoutClient user={userWithVerification}>
        {children}
      </LayoutClient>
    </>
  );
}
```

**GUARDRAIL RULES (MANDATORY):**

1. **Main layout MUST be synchronous** - NO `async function Layout`
2. **Async operations MUST be inside Suspense** - Create separate `layout-content.tsx`
3. **Dynamic data (cookies/headers) REQUIRES Suspense** - Not optional in Next.js 16
4. **Loading fallback is MANDATORY** - Create skeleton UI for fluid UX
5. **React cache() is for performance, NOT for fixing Suspense** - They are two different things
6. **`await connection()` MUST be first line** in async content components

**React cache() Pattern (for performance, not Suspense fix):**
```tsx
// lib/auth/cached-user.ts
'use server';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
```

**WHEN TO USE cache():**
- ✅ Deduplicate repeated DB calls in the same request
- ✅ Optimize performance with multiple fetches of the same data
- ✅ Reduce database queries in parallel components
- ❌ DO NOT use as a fix for Suspense errors (it doesn't work!)

**Architecture Pattern:**
```
Layout (sync) → Suspense Boundary → LayoutContent (async) → Children

✅ Next.js can stream content progressively
✅ Loading state visible to user immediately
✅ No blocking async operations in layout root
✅ cookies()/headers() safely accessed inside Suspense
```

### 1b. PPR Error Troubleshooting Guide

**🔴 ERROR: "Uncached data was accessed outside of <Suspense>"**
```
Error: Route "/login": Uncached data was accessed outside of <Suspense>
(see https://nextjs.org/docs/messages/next-request-in-use-cache).
```

| Cause | Solution |
|-------|----------|
| Async page without Suspense wrapper | Wrap in `<Suspense>` or move auth check to layout |
| `cookies()`/`headers()` in page root | Use layout-content pattern |
| `connection()` without Suspense | `connection()` signals dynamic, doesn't CREATE boundary |

**🔴 ERROR: "During prerendering, cookies() rejects"**
```
Exception in getCachedUser: Error: During prerendering, cookies() rejects
when the prerender is complete.
```

| Cause | Solution |
|-------|----------|
| PPR trying to prerender dynamic code | Add `await connection()` inside Suspense |
| Missing Suspense boundary | Wrap async component in `<Suspense>` |
| `createClient()` in layout root | Move to layout-content.tsx |

**🔴 ERROR: "headers was called outside a request scope"**
```
Error: `headers` was called outside a request scope. Read more:
https://nextjs.org/docs/messages/next-dynamic-api-wrong-context
```

| Cause | Solution |
|-------|----------|
| `headers()` called at module level | Move inside async function |
| Missing `connection()` call | Add `await connection()` before `headers()` |

**Decision Tree for New Layouts/Pages:**
```
Creating new layout.tsx?
├── Does it need user data (auth, profile)?
│   ├── YES → Use 3-file pattern:
│   │         1. layout.tsx (sync + Suspense)
│   │         2. layout-content.tsx (async + connection)
│   │         3. layout-client.tsx (if hooks needed)
│   └── NO → Simple sync layout is fine
│
Creating new page.tsx?
├── Does it call cookies()/headers()/redirect()?
│   ├── YES → Wrap in Suspense:
│   │         export default function Page() {
│   │           return <Suspense><PageContent /></Suspense>
│   │         }
│   └── NO → Simple sync/async page is fine
```

### 1c. Auth Pages Pattern (Page-Level Suspense)

**⚠️ UPDATED:** Auth pages use **page-level Suspense** (not layout-level). Each page handles its own auth check independently.

```
(auth)/
├── layout.tsx                  # SYNC - pure visual wrapper (logo, back button)
├── auth-card-skeleton.tsx      # Shared skeleton for Suspense fallback
├── login/
│   ├── page.tsx                # SYNC - Suspense wrapper
│   ├── login-content.tsx       # ASYNC - redirectIfAuthenticated()
│   └── login-form.tsx          # Client Component - form UI + Google OAuth
├── register/
│   ├── page.tsx                # SYNC - Suspense wrapper
│   ├── register-content.tsx    # ASYNC - redirectIfAuthenticated()
│   └── register-form.tsx       # Client Component - form UI + Google OAuth
├── forgot-password/
│   ├── page.tsx                # SYNC - Suspense wrapper
│   ├── forgot-password-content.tsx
│   └── forgot-password-form.tsx
└── reset-password/
    ├── page.tsx                # SYNC - Suspense wrapper
    ├── reset-password-content.tsx
    └── reset-password-form.tsx
```

**✅ CORRECT Auth Pattern (3-file per page):**

```tsx
// (auth)/layout.tsx - SYNC, visual only, NO auth logic
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Button variant="outline" size="sm" asChild className="absolute top-4 left-4">
        <Link href={ROUTES.HOME}><ArrowLeft /> Home</Link>
      </Button>
      <div className="w-full max-w-md space-y-8">
        <Link href={ROUTES.HOME}>
          <Image src="/assets/logos/logo-pratorinaldo.png" ... />
          <h1>{APP_NAME}</h1>
        </Link>
        {children} {/* Each page handles its own Suspense */}
      </div>
    </div>
  );
}

// (auth)/login/page.tsx - SYNC, Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

// (auth)/login/login-content.tsx - ASYNC, auth check
export async function LoginContent() {
  await connection();                    // MUST be first line
  await redirectIfAuthenticated();       // Redirect if logged in
  return <LoginForm />;
}

// (auth)/login/login-form.tsx - Form UI with Google OAuth
export function LoginForm() {
  return (
    <Card>
      <form action={signIn}>
        {/* Email/password fields */}
      </form>
      <GoogleSignInButton mode="signin" />
    </Card>
  );
}
```

**Why Page-Level Suspense (not Layout-Level)?**
- ✅ Each page can have different auth behavior (verify-email is for authenticated users)
- ✅ Cleaner separation of concerns (layout = visual, page = logic)
- ✅ Avoids complex header-based path detection
- ✅ Better error boundaries per page
- ❌ Layout-level auth-layout-content.tsx was removed (caused RSC serialization issues)

### 2. Data Access Layer (DAL) Pattern

Authentication and authorization are centralized in `lib/auth/dal.ts`:

```tsx
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES, VERIFICATION_STATUS } from '@/lib/utils/constants';

// Optional auth (public pages)
export async function getSession(): Promise<User | null> { ... }

// Required auth (redirects to login if not authenticated)
export async function requireAuth(): Promise<User> { ... }

// Verified resident status (redirects if not approved)
export async function requireVerifiedResident(): Promise<VerifiedResident> { ... }

// Admin access (redirects if not admin/moderator)
export async function requireAdmin(): Promise<AdminUser> { ... }

// Helper checks (no redirects, return boolean)
export async function isVerifiedResident(userId: string): Promise<boolean> { ... }
export async function isAdmin(userId: string): Promise<boolean> { ... }
export async function canEdit(userId: string, ownerId: string): Promise<boolean> { ... }
```

**Usage in Page Components:**
```tsx
// In page.tsx (NOT layout.tsx)
import { requireVerifiedResident } from '@/lib/auth/dal';

export default async function PrivatePage() {
  const user = await requireVerifiedResident(); // Redirects if not approved
  return <PageContent user={user} />;
}
```

### 3. Cached User Functions

`lib/auth/cached-user.ts` provides 5 cached user fetch variants:

| Function | Use Case | Fields |
|----------|----------|--------|
| `getCachedUser()` | Basic auth user | Auth user only |
| `getCachedUserProfile()` | Full profile | role, admin_role, verification_status, onboarding_completed, avatar |
| `getCachedUserMinimal()` | Public layouts | verification_status, role, avatar |
| `getCachedUserAuth()` | Auth routes | onboarding_completed, verification_status, role, avatar |
| `getCachedUserAdmin()` | Admin routes | role, admin_role, verification_status, avatar |

### 4. Route Organization & Access Control

**Route Groups (6 total):**
| Group | Access | Example Routes |
|-------|--------|----------------|
| `(auth)/` | Unauthenticated only | `/login`, `/register`, `/forgot-password` |
| `(public)/` | All users | `/`, `/events`, `/marketplace`, `/feed`, `/articles` |
| `(authenticated)/` | Any logged-in user | `/settings` |
| `(private)/` | Verified residents | `/bacheca`, `/agora`, `/resources`, `/messages` |
| `(admin)/admin/` | Admin/Super Admin/Moderator | `/admin/users`, `/admin/moderation`, `/admin/settings` |
| `onboarding/` | Auth users without completed onboarding | `/onboarding` |

**Access Control Pattern:**
- `(auth)` pages: Use `redirectIfAuthenticated()` to redirect logged-in users
- `(authenticated)` pages: Use `requireAuth()` in page components
- `(private)` pages: Use `requireVerifiedResident()` in page components
- `(admin)` pages: Use `requireAdmin()` in page components

**Constants for Routes:**
Always use `ROUTES` constants from `lib/utils/constants.ts`. DO NOT use template strings for routes (Next.js 16 type strictness):

```tsx
// ✅ CORRECT
import { ROUTES } from '@/lib/utils/constants';
href={ROUTES.ADMIN_USERS}  // '/admin/users'

// ❌ WRONG
href={`${ROUTES.ADMIN}/users`}  // Type error in Next.js 16
```

### 4a. TypedRoutes Guardrails (Next.js 16)

**CRITICAL:** Next.js 16 with `typedRoutes: true` in `next.config.ts` enforces strict route typing. Template strings and dynamic paths cause TypeScript errors.

**Common Errors:**
```
Argument of type 'string' is not assignable to parameter of type 'RouteImpl<string>'
Type 'string' is not assignable to type 'Route<string>'
```

**✅ CORRECT Patterns:**

```tsx
// 1. Static routes from constants
import { ROUTES } from '@/lib/utils/constants';
<Link href={ROUTES.LOGIN}>Login</Link>

// 2. Dynamic routes with as Route cast
import type { Route } from 'next';
<Link href={`/articles/${slug}` as Route}>Read Article</Link>

// 3. Using useRouter with cast
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
router.push(pathname as Route);

// 4. Conditional routes
const href = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.BACHECA;
<Link href={href as Route}>{label}</Link>
```

**❌ WRONG Patterns:**
```tsx
// Template string without cast
<Link href={`/users/${userId}`}>Profile</Link>  // TS Error

// Concatenation without cast
<Link href={ROUTES.ADMIN + '/users'}>Admin</Link>  // TS Error

// String interpolation without cast
router.push(`/events/${eventId}`);  // TS Error
```

**Rule:** When using dynamic paths, ALWAYS add `as Route` cast:
```tsx
import type { Route } from 'next';
const dynamicPath = `/entity/${id}` as Route;
```

### 5. Supabase Client Usage

**Three client types:**

1. **Server Client** (`lib/supabase/server.ts`) - Server Components, Server Actions
```tsx
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient(); // Uses cookies() from next/headers
```

2. **Browser Client** (`lib/supabase/client.ts`) - Client Components
```tsx
import { createClient } from '@/lib/supabase/client';
const supabase = createClient(); // Browser-based
```

3. **Admin Client** (`lib/supabase/server.ts`) - Bypasses RLS (use with caution)
```tsx
import { createAdminClient } from '@/lib/supabase/server';
const supabase = createAdminClient(); // Service role key
```

### 5a. Google OAuth/SSO Integration

**Supabase OAuth with PKCE flow** is implemented for Google sign-in.

**Key Files:**
| File | Purpose |
|------|---------|
| `components/molecules/google-sign-in-button.tsx` | Client Component with OAuth trigger |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `docs/GOOGLE_SSO_SETUP_GUIDE.md` | Step-by-step setup guide |

**OAuth Flow:**
```
1. User clicks "Accedi con Google" button
2. signInWithOAuth() redirects to Google consent screen
3. User authorizes the app
4. Google redirects to Supabase callback:
   https://<PROJECT>.supabase.co/auth/v1/callback
5. Supabase exchanges code for session
6. Supabase redirects to app callback:
   /auth/callback?code=xxx
7. App callback exchanges code for local session
8. User redirected to /bacheca or /onboarding
```

**Client Component Pattern:**
```tsx
// components/molecules/google-sign-in-button.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export function GoogleSignInButton({ mode = 'signin' }) {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',  // Required for refresh tokens
          prompt: 'consent',       // Always show consent screen
        },
      },
    });
  };

  return (
    <Button onClick={handleGoogleSignIn}>
      {mode === 'signup' ? 'Registrati con Google' : 'Accedi con Google'}
    </Button>
  );
}
```

**OAuth Callback Handler:**
```tsx
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors (e.g., user cancelled)
  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=${error}`);
  }

  const supabase = await createClient();
  await supabase.auth.exchangeCodeForSession(code);

  // For OAuth users, update profile with provider data
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.provider !== 'email') {
    // Extract name/avatar from OAuth metadata
    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    // Update profile if needed...
  }

  // Redirect based on onboarding status
  return NextResponse.redirect(`${origin}${ROUTES.BACHECA}`);
}
```

**Setup Checklist:** See `docs/GOOGLE_SSO_SETUP_GUIDE.md` for complete setup:
- [ ] Google Cloud Console: Create OAuth client, configure consent screen
- [ ] Supabase Dashboard: Enable Google provider, add Client ID/Secret
- [ ] Environment: Configure redirect URIs for dev/prod

### 6. Server Actions Pattern

All API logic uses Server Actions (`app/actions/*.ts`). Pattern:

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { schema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';

export async function actionName(formData: FormData) {
  // 1. Parse and validate input
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Validation error message' };
  }

  // 2. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autenticato' };

  // 3. Perform database operations
  const { error } = await supabase.from('table').insert(data);
  if (error) return { error: 'Error message' };

  // 4. Revalidate and redirect
  revalidatePath('/path');
  redirect(ROUTES.SUCCESS_PAGE);
}
```

**Server Actions Files (19 total):**
| File | Purpose |
|------|---------|
| `auth.ts` | signIn, signUp, signOut, password reset |
| `admin.ts` | User management, role assignment |
| `announcements.ts` | Announcement CRUD |
| `articles.ts` | Article creation, publishing, deletion |
| `categories.ts` | Category management (proposals, events, marketplace) |
| `conversations.ts` | Messaging system - conversation/message operations |
| `email-notifications.ts` | Email sending via Resend API |
| `events.ts` | Event CRUD, RSVP management |
| `feed.ts` | Public feed operations (likes, comments) |
| `gamification.ts` | Badge assignment, points tracking |
| `marketplace.ts` | Marketplace item CRUD, status updates |
| `moderation.ts` | Content moderation (approve, reject, delete) |
| `proposals.ts` | Civic proposals - create, vote, status updates |
| `resources.ts` | Community resources management |
| `service-profiles.ts` | Professional/volunteer profile CRUD |
| `site-settings.ts` | Site-wide configuration |
| `storage.ts` | File upload/deletion to Supabase Storage |
| `tenant-settings.ts` | Multi-tenant configuration |
| `users.ts` | User profile updates, verification |

### 7. PageLayout System

The app uses a **unified sidebar layout** (`components/organisms/layout/page-layout.tsx`) across most pages:

```tsx
import { PageLayout } from '@/components/organisms/layout/page-layout';

// In *-layout-client.tsx
export function LayoutClient({ user, children }) {
  return <PageLayout user={user}>{children}</PageLayout>;
}
```

**Exception:** Home page (`pathname === '/'`) renders without PageLayout (no sidebar).

### 8. Multi-Tenant Architecture

Database uses **Row Level Security (RLS)** for tenant isolation:
- All tables have `tenant_id` foreign key
- RLS policies filter by `tenant_id` from user's session
- Current tenant: "Prato Rinaldo" (`TENANT_SLUG='prato-rinaldo'`)

## Database Schema

**29 migrations** in `supabase/migrations/`. Key features:

### Core Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant configuration (subscription, branding) |
| `users` | Extended profiles (50+ columns, linked to auth.users) |
| `user_badges` | Gamification badges (6 types) |
| `user_points` | Points tracking |

### Content Tables

| Table | Purpose |
|-------|---------|
| `articles` | Blog posts (status: draft/published/archived) |
| `announcements` | Pinned messages |
| `events` | Public/private events with RSVP |
| `event_rsvps` | Event attendance |
| `marketplace_items` | Buy/sell listings (public/private) |
| `service_profiles` | Professional/volunteer directory |
| `resources` | Community resources |
| `categories` | Unified categories (proposals, events, marketplace) |

### Civic Engagement (Agorà)

| Table | Purpose |
|-------|---------|
| `proposals` | Civic proposals with status workflow |
| `proposal_votes` | Up/down voting |
| `proposal_comments` | Discussion on proposals |
| `proposal_attachments` | File attachments on proposals |

### Messaging System

| Table | Purpose |
|-------|---------|
| `conversations` | Buyer-seller conversations (marketplace) |
| `messages` | Messages within conversations |

### Moderation

| Table | Purpose |
|-------|---------|
| `moderation_queue` | Centralized moderation for all content |
| `moderation_actions` | Audit log of moderation decisions |

### Admin & Settings

| Table | Purpose |
|-------|---------|
| `site_settings` | Global configuration |
| `aggregated_stats` | Pre-calculated dashboard statistics |

### Key Migrations

| Migration | Description |
|-----------|-------------|
| `00000_initial_schema.sql` | Core tables, 17 ENUMs |
| `00001_rls_policies.sql` | Row Level Security |
| `00002_storage_buckets.sql` | Storage configuration |
| `00006_agora_system.sql` | Civic proposals system |
| `00008_remove_forum_system.sql` | Removed forum (replaced by Agorà) |
| `00018_messaging_system.sql` | Conversations & messages |
| `00027_proposal_attachments.sql` | Proposal file attachments |
| `20250127_add_categories_system.sql` | Unified categories |

### ENUM Types (17 total)

**Roles:** `user_role`, `admin_role`, `committee_role`
**Content:** `content_status`, `marketplace_status`, `proposal_status`
**Moderation:** `moderation_status`, `moderation_priority`, `moderation_item_type`, `moderation_action_type`
**User:** `membership_type`, `municipality`, `verification_status`
**Session:** `subscription_status`, `subscription_type`, `event_rsvp_status`, `payment_status`

## Component Architecture

**Atomic Design Pattern:**
```
components/
  ├── ui/          # shadcn/ui components (60+ files, DO NOT modify)
  ├── atoms/       # Basic building blocks (1 file)
  ├── molecules/   # Composite components (22 files)
  └── organisms/   # Complex page sections
      ├── header/      # Navigation header, mobile menu
      ├── footer/      # Footer, conditional footer
      ├── layout/      # PageLayout, sidebars, loading states
      ├── editor/      # Tiptap rich text editor
      ├── feed/        # Unified feed card, filters, interaction bar
      ├── bacheca/     # Personal dashboard modules
      ├── admin/       # Admin-specific components
      └── community-pro/  # Professional/volunteer signup
```

**Key Components:**
- `components/organisms/feed/unified-feed-card.tsx` - Flexible card for feed items
- `components/organisms/editor/rich-text-editor.tsx` - Tiptap WYSIWYG editor
- `components/organisms/layout/page-layout.tsx` - Unified sidebar layout
- `components/organisms/layout/loading-header.tsx` - Suspense fallback skeleton
- `components/molecules/image-upload.tsx` - Drag-drop file upload
- `components/molecules/google-sign-in-button.tsx` - Google OAuth button
- `components/organisms/auth/auth-error-handler.tsx` - OAuth error display
- `app/(auth)/auth-card-skeleton.tsx` - Auth pages Suspense fallback

## Supabase Edge Functions

**4 deployed functions** with cron scheduling:

1. **calculate-badges** (`0 * * * *` - hourly)
   - Auto-assigns badges to verified users
   - 6 badge types (Welcome, First Post, Seller, Active Participant, Contributor, Volunteer)

2. **email-notifications** (webhook-triggered)
   - Sends moderation emails via Resend API
   - Triggers on `moderation_queue` table changes

3. **cleanup-sessions** (`0 2 * * *` - daily 2 AM)
   - Cleans expired auth sessions, temp files, old RSVPs, rejected moderation

4. **aggregate-stats** (`0 */6 * * *` - every 6 hours)
   - Pre-calculates 20+ stats for admin dashboard
   - Stores in `aggregated_stats` table

**Deploy functions:**
```bash
pnpm exec supabase functions deploy <function-name>
```

## User Roles & Permissions

**Admin Roles:** `super_admin`, `admin`, `moderator`
**Committee Roles:** `president`, `vice_president`, `secretary`, `treasurer`, `board_member`, `council_member`
**Membership Types:** `resident`, `domiciled`, `landowner`
**Verification Status:** `pending`, `approved`, `rejected`

**Access Hierarchy:**
| Route Type | Required Status |
|------------|-----------------|
| Public | All users |
| Authenticated | Any logged-in user |
| Private | `verification_status === 'approved'` |
| Admin | `role IN ('admin', 'super_admin')` OR `admin_role === 'moderator'` |

## Key Files to Reference

| Category | Files |
|----------|-------|
| **Constants** | `lib/utils/constants.ts` - All ROUTES, ROLES, STATUSES |
| **Validators** | `lib/utils/validators.ts` - Zod schemas (20+) |
| **Types** | `lib/supabase/types.ts` - Auto-generated from schema |
| **DAL** | `lib/auth/dal.ts` - Authorization functions |
| **Cached User** | `lib/auth/cached-user.ts` - React cache() wrapped user fetching |
| **Actions** | `app/actions/*.ts` - All server-side logic (19 files) |
| **Config** | `next.config.ts` - Next.js configuration |
| **OAuth Callback** | `app/auth/callback/route.ts` - Supabase OAuth/PKCE handler |
| **Google OAuth** | `components/molecules/google-sign-in-button.tsx` - OAuth button |
| **SSO Docs** | `docs/GOOGLE_SSO_SETUP_GUIDE.md` - Google Console/Supabase setup |

## Common Patterns to Follow

1. **Type Safety:** Use generated Supabase types, avoid `any` except for user props in layout components
2. **Validation:** Always validate with Zod before database operations
3. **Error Handling:** Return `{ error: string }` from Server Actions
4. **Revalidation:** Call `revalidatePath()` after mutations
5. **Redirects:** Use `redirect()` from `next/navigation`, not `router.push()`
6. **Imports:** Use `@/` alias for absolute imports
7. **Styling:** Use Tailwind utility classes, cn() helper for conditional classes

## Critical Build Requirements

### Pre-Flight Checklist (Before `pnpm dev`)

When creating or modifying layouts/pages with auth:

- [ ] Layout file is **sync** (no `async function Layout`)
- [ ] Async code is in separate `layout-content.tsx`
- [ ] `<Suspense>` wraps the async content component
- [ ] `await connection()` is **first line** in async content
- [ ] Skeleton/loading fallback is provided for Suspense
- [ ] No `cookies()`/`headers()` calls outside Suspense boundary

### Mandatory Rules

1. **Never** put `'use client'` mid-file - must be first line or separate file
2. **Always** use ROUTES constants, never template strings for hrefs
3. **Separate** Server and Client Components into different files for layouts
4. **Import** `next/headers` (cookies, headers) only in Server Components
5. **Import** `next/navigation` hooks (usePathname, useRouter) only in Client Components
6. **ALWAYS** wrap async layouts in Suspense boundary with loading fallback
7. **NEVER** call `await createClient()` directly in layout root scope - use layout-content.tsx pattern
8. **ALWAYS** use React `cache()` for repeated async operations (performance optimization)
9. **NEVER** assume `cache()` fixes Suspense errors (it doesn't - you need Suspense boundary)
10. **ALWAYS** create loading skeleton UI for Suspense fallback (better UX than blank screen)
11. **ALWAYS** add `await connection()` as first line in async content components
12. **NEVER** use `connection()` alone to fix PPR errors - it needs Suspense boundary around it

## Next.js 16 Configuration

`next.config.ts` key settings:
- `typedRoutes: true` - Type-safe routing
- `cacheComponents: true` - Partial Prerendering (PPR)
- `output: 'standalone'` - Docker-optimized build
- `serverActions.bodySizeLimit: '10mb'` - File upload limit
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_NAME=Community Prato Rinaldo
NEXT_PUBLIC_TENANT_SLUG=prato-rinaldo
```

## Testing & Deployment

**Local Development:** `pnpm dev` (Turbopack hot reload)
**Production Build:** `pnpm build` (validates types, builds static/server bundles)
**Docker:** Full Docker Compose setup in `docker/` directory
**Platforms:** Compatible with Vercel, Railway, Fly.io, self-hosted VPS

## Hooks

Custom React hooks in `hooks/`:

| Hook | Purpose |
|------|---------|
| `use-mobile.ts` | Responsive breakpoint detection (768px) |

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

function Component() {
  const isMobile = useIsMobile(); // true if < 768px
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## Tips & Best Practices

### Development Workflow

1. **Always run `pnpm type-check` before committing** - TypedRoutes errors only surface during type-check
2. **Use `pnpm dev` with Turbopack** - Hot reload is faster, but RSC errors may differ from production
3. **Test OAuth flows in production-like environment** - Google OAuth redirects don't work on `localhost` with some configurations
4. **Clear `.next` cache when encountering RSC serialization issues** - `rm -rf .next && pnpm dev`

### Common Pitfalls to Avoid

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Auth check in layout root | RSC payload instead of HTML | Move to page-level content component |
| Missing `await connection()` | PPR prerender errors | Add as first line in async component |
| Template string routes | TypeScript route errors | Use `as Route` cast or ROUTES constant |
| `cookies()` outside Suspense | "Uncached data" error | Wrap in Suspense boundary |
| OAuth without redirect URL | Infinite redirect loop | Set correct `redirectTo` in signInWithOAuth |
| Mixing Server/Client in file | Hydration mismatch | Separate into different files |

### Performance Tips

1. **Use `cache()` for repeated database queries** - Deduplicates within same request
2. **Prefer Server Components** - Only use `'use client'` when needed (interactivity, hooks)
3. **Use `getCachedUserMinimal()` for layouts** - Fetches only essential fields
4. **Implement skeleton UI for Suspense** - Better UX than blank screens
5. **Lazy load heavy components** - Use `dynamic()` for editors, maps, charts

### Security Reminders

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side** - Use server-only
2. **Always validate with Zod before database operations** - Prevent injection
3. **Use RLS policies in Supabase** - Defense in depth for multi-tenant
4. **Sanitize user input in rich text** - TipTap editor output should be sanitized
5. **OAuth providers should use PKCE flow** - Already configured in Supabase

### Debugging Checklist

When something doesn't work:

- [ ] Check browser console for client-side errors
- [ ] Check terminal for server-side errors
- [ ] Verify Supabase connection (Network tab → supabase.co requests)
- [ ] Check RLS policies if data not appearing (Supabase Dashboard → SQL Editor)
- [ ] Verify user is authenticated (`supabase.auth.getUser()`)
- [ ] Clear `.next` cache and restart dev server
- [ ] Check environment variables are loaded

### Code Review Checklist

Before merging:

- [ ] No `any` types (except user props in layouts)
- [ ] All routes use ROUTES constants or `as Route` cast
- [ ] Server Actions return `{ error: string }` on failure
- [ ] `revalidatePath()` called after mutations
- [ ] Zod validation on all user input
- [ ] No sensitive data in client components
- [ ] Suspense boundaries for async components
- [ ] Loading skeletons provided for Suspense fallbacks

---

**Version:** 2.4.0 | **Last Updated:** November 2025 | **Changes:**
- **BREAKING:** Section 1c - Auth pages now use page-level Suspense (not layout-level)
- **REMOVED:** `app/(auth)/auth-layout-content.tsx` - caused RSC serialization issues
- **NEW:** Section 5a - Google OAuth/SSO Integration with PKCE flow
- **NEW:** Section 4a - TypedRoutes Guardrails with `as Route` patterns
- **NEW:** Tips & Best Practices section with debugging checklists
- **NEW:** Auth page 3-file pattern: page.tsx → content.tsx → form.tsx
- **UPDATED:** Component list with OAuth-related components
- **UPDATED:** Key files now include OAuth callback and Google SSO docs
- Fixed auth redirect issues that caused raw RSC payload response
