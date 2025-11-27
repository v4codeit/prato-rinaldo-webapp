import { Suspense } from 'react';
import { LoadingHeader } from '@/components/organisms/layout/loading-header';
import { MainLayoutContent } from './layout-content';

/**
 * Main Layout - Unified layout for all non-admin, non-auth pages
 *
 * This layout uses Suspense boundary to prevent "Uncached data accessed outside of Suspense" errors.
 * Pattern: Layout (sync) → Suspense → LayoutContent (async, fetches user) → Children
 *
 * NO auth checks or redirects - auth is handled at page level using DAL functions.
 * - Public pages: no auth required
 * - Private pages: use requireVerifiedResident() in page.tsx
 * - Authenticated pages: use requireAuthWithOnboarding() in page.tsx
 *
 * FIXES: Next.js 16 + Turbopack error by wrapping async cookie access in Suspense.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<LoadingHeader />}>
        <MainLayoutContent>{children}</MainLayoutContent>
      </Suspense>
    </div>
  );
}
