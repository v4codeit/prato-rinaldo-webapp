import { Suspense } from 'react';
import { LoadingHeader } from '@/components/organisms/layout/loading-header';
import { AuthenticatedLayoutContent } from './layout-content';

/**
 * Authenticated Layout - Suspense Pattern for Dynamic Data
 *
 * This layout uses Suspense boundary to prevent "Uncached data accessed outside of Suspense" errors.
 * Pattern: Layout (sync) → Suspense → LayoutContent (async, fetches user) → Children
 *
 * NO auth checks or redirects - auth/onboarding checks are in page components using DAL.
 * Pages in this route group should call requireAuth() or requireAuthWithOnboarding().
 *
 * FIXES: Next.js 16 + Turbopack error by wrapping async cookie access in Suspense.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LoadingHeader />}>
        <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
      </Suspense>
    </div>
  );
}
