# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prato Rinaldo Community Platform** is a Next.js 16 multi-tenant community management system for the Prato Rinaldo Residents Committee (frazione between San Cesareo and Zagarolo, Rome). Built with App Router, React 19, Supabase, and TypeScript.

**Tech Stack:**
- Next.js 16 (App Router, Turbopack, Cache Components)
- React 19 with Server Components
- TypeScript 5.7
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Tailwind CSS 4 + shadcn/ui
- Server Actions (zero-config API)
- Zod validation
- pnpm package manager

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
  ├── layout.tsx              # Server Component (async, DB queries, auth)
  └── *-layout-client.tsx     # Client Component (hooks, interactivity)
```

**Server Component (layout.tsx):**
```tsx
import { createClient } from '@/lib/supabase/server';
import { LayoutClient } from './layout-client';

/**
 * ⚠️ NOTA: Questo pattern causa "Uncached data accessed outside of Suspense" in Next.js 16.
 * Soluzione corretta: Vedi sezione 1a "Async Layouts & Suspense Boundaries"
 */
export default async function Layout({ children }) {
  const supabase = await createClient(); // ⚠️ Richiede Suspense boundary!
  const { data: { user } } = await supabase.auth.getUser();

  return <LayoutClient user={user}>{children}</LayoutClient>;
}

/**
 * ✅ PATTERN CORRETTO: Layout (sync) + Suspense + LayoutContent (async)
 * Vedi sezione 1a per implementazione completa
 */
```

**Client Component (*-layout-client.tsx):**
```tsx
'use client';

import { usePathname } from 'next/navigation';

export function LayoutClient({ user, children }) {
  const pathname = usePathname(); // ✅ Client hooks only
  return <div>...</div>;
}
```

### 1a. Async Layouts & Suspense Boundaries (CRITICAL)

**⚠️ PROBLEMA COMUNE:** Next.js 16 + Turbopack genera errore "Uncached data accessed outside of Suspense" quando layouts chiamano `cookies()` o `headers()` direttamente.

**❌ PATTERN ERRATO (causa errore runtime):**
```tsx
// layout.tsx - SBAGLIATO
export default async function Layout({ children }) {
  const supabase = await createClient(); // ❌ Errore: cookies() senza Suspense
  const { data: { user } } = await supabase.auth.getUser();
  return <Header user={user} />{children};
}
```

**Problema:** `createClient()` chiama internamente `await cookies()`, che è dynamic data. Next.js 16 richiede che dynamic data sia wrappato in Suspense o il rendering si blocca completamente.

**✅ PATTERN CORRETTO (Layout + Suspense + Content Component):**
```tsx
// layout.tsx - CORRETTO (sync, no async)
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
// layout-content.tsx - CORRETTO (async Server Component)
import { getCachedUser } from '@/lib/auth/cached-user';
import { Header } from '@/components/organisms/header/header';
import { LayoutClient } from './layout-client';

export async function LayoutContent({ children }) {
  const user = await getCachedUser(); // ✅ OK: dentro Suspense boundary

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

1. **Layout principale DEVE essere sincrono** - NO `async function Layout`
2. **Async operations DEVONO stare dentro Suspense** - Crea `layout-content.tsx` separato
3. **Dynamic data (cookies/headers) RICHIEDE Suspense** - Non opzionale in Next.js 16
4. **Loading fallback è MANDATORY** - Crea skeleton UI per UX fluida
5. **React cache() serve per performance, NON per fix Suspense** - Sono due cose diverse

**React cache() Pattern (per performance, not Suspense fix):**
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

**QUANDO USARE cache():**
- ✅ Deduplicare chiamate DB ripetute nella stessa request
- ✅ Ottimizzare performance con fetch multipli dello stesso dato
- ✅ Ridurre query database in componenti paralleli
- ❌ NON usare come fix per errori Suspense (non funziona!)

**Loading Skeleton UI Pattern:**
```tsx
// components/organisms/layout/loading-header.tsx
import Image from 'next/image';
import { APP_NAME } from '@/lib/utils/constants';

export function LoadingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo sempre visibile */}
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt={APP_NAME} width={40} height={40} />
          <span className="text-xl font-bold">{APP_NAME}</span>
        </div>

        {/* Navigation skeleton */}
        <nav className="hidden md:flex items-center space-x-6">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </nav>

        {/* Auth skeleton */}
        <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
      </div>
    </header>
  );
}
```

**ERROR MESSAGES da Evitare:**
- `"Uncached data accessed outside of <Suspense>"` → Fix: Add Suspense boundary
- `"cookies() was called outside a request scope"` → Fix: Use inside Server Component with Suspense
- `"headers() was called outside a request scope"` → Fix: Same as above
- `"Route /path: Uncached data accessed outside of Suspense"` → Fix: Refactor async layout to sync + Suspense pattern

**Architecture Pattern:**
```
Layout (sync) → Suspense Boundary → LayoutContent (async) → Children

✅ Next.js can stream content progressively
✅ Loading state visible to user immediately
✅ No blocking async operations in layout root
✅ cookies()/headers() safely accessed inside Suspense
```

### 2. Route Organization & Access Control

**Route Groups:**
- `(auth)/` - Login, register, forgot password (redirects if authenticated)
- `(public)/` - Public pages accessible to all (home, events, marketplace, etc.)
- `(authenticated)/` - Pages for any logged-in user (profile, settings)
- `(private)/` - Pages requiring verified resident status (agora, resources)
- `(admin)/admin/` - Admin panel (admin/super_admin/moderator only)

**Access Control Pattern:**
Each layout performs server-side authentication and authorization checks before rendering. Unauthorized users are redirected via `redirect()` from `next/navigation`.

**Constants for Routes:**
Always use `ROUTES` constants from `lib/utils/constants.ts`. DO NOT use template strings for routes (Next.js 16 type strictness):

```tsx
// ✅ CORRECT
import { ROUTES } from '@/lib/utils/constants';
href={ROUTES.ADMIN_USERS}  // '/admin/users'

// ❌ WRONG
href={`${ROUTES.ADMIN}/users`}  // Type error in Next.js 16
```

### 3. Supabase Client Usage

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

### 4. Server Actions Pattern

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

### 5. PageLayout System

The app uses a **unified sidebar layout** (`components/organisms/layout/page-layout.tsx`) across most pages:

```tsx
import { PageLayout } from '@/components/organisms/layout/page-layout';

// In *-layout-client.tsx
export function LayoutClient({ user, children }) {
  return <PageLayout user={user}>{children}</PageLayout>;
}
```

**Exception:** Home page (`pathname === '/'`) renders without PageLayout (no sidebar).

### 6. Multi-Tenant Architecture

Database uses **Row Level Security (RLS)** for tenant isolation:
- All tables have `tenant_id` foreign key
- RLS policies filter by `tenant_id` from user's session
- Current tenant: "Prato Rinaldo" (`TENANT_SLUG='prato-rinaldo'`)

### 7. Database Schema

**21 tables** with comprehensive ENUM types. Key tables:
- `tenants` - Multi-tenant configuration
- `users` - Extended user profiles (linked to auth.users)
- `events`, `marketplace`, `service_profiles` - Content tables
- `forum_threads`, `forum_posts` - Community forum
- `moderation_queue` - Centralized moderation
- `user_badges`, `user_points` - Gamification

**Migrations:** Located in `supabase/migrations/`:
- `00000_initial_schema.sql` - Full schema (21 tables, 17 ENUMs)
- `00001_rls_policies.sql` - Row Level Security
- `00002_storage_buckets.sql` - Storage configuration
- `00003_realtime_config.sql` - Realtime subscriptions
- `00004_seed_data.sql` - Initial data (tenant, badges, categories)

## Component Architecture

**Atomic Design Pattern:**
```
components/
  ├── atoms/       # NOT USED - use shadcn/ui components instead
  ├── molecules/   # Composite components (stat-card, featured-banner, etc.)
  └── organisms/   # Complex components (header, footer, layout/*)
```

**shadcn/ui components:** Located in `components/ui/` (DO NOT modify directly, managed by shadcn CLI).

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

**Access hierarchy:**
- Public routes: All users
- Authenticated routes: Any logged-in user
- Private routes: `verification_status === 'approved'` only
- Admin routes: `role IN ('admin', 'super_admin')` OR `admin_role === 'moderator'`

## Key Files to Reference

**Constants:** `lib/utils/constants.ts` - All ROUTES, ROLES, STATUSES
**Validators:** `lib/utils/validators.ts` - Zod schemas
**Types:** `lib/supabase/types.ts` - Auto-generated from Supabase schema
**Actions:** `app/actions/*.ts` - All server-side logic organized by domain

## Common Patterns to Follow

1. **Type Safety:** Use generated Supabase types, avoid `any` except for user props in layout components
2. **Validation:** Always validate with Zod before database operations
3. **Error Handling:** Return `{ error: string }` from Server Actions
4. **Revalidation:** Call `revalidatePath()` after mutations
5. **Redirects:** Use `redirect()` from `next/navigation`, not `router.push()`
6. **Imports:** Use `@/` alias for absolute imports
7. **Styling:** Use Tailwind utility classes, cn() helper for conditional classes

## Critical Build Requirements

1. **Never** put `'use client'` mid-file - must be first line or separate file
2. **Always** use ROUTES constants, never template strings for hrefs
3. **Separate** Server and Client Components into different files for layouts
4. **Import** `next/headers` (cookies, headers) only in Server Components
5. **Import** `next/navigation` hooks (usePathname, useRouter) only in Client Components
6. **ALWAYS** wrap async layouts in Suspense boundary with loading fallback (see section 1a)
7. **NEVER** call `await createClient()` directly in layout root scope - use layout-content.tsx pattern
8. **ALWAYS** use React `cache()` for repeated async operations (performance optimization)
9. **NEVER** assume `cache()` fixes Suspense errors (it doesn't - you need Suspense boundary)
10. **ALWAYS** create loading skeleton UI for Suspense fallback (better UX than blank screen)

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

---

**Version:** 2.1.0 | **Last Updated:** January 2025 | **Changes:** Added Async Layouts & Suspense Boundaries guardrails (section 1a)
