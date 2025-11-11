import { Suspense } from 'react';
import { LoadingHeader } from '@/components/organisms/layout/loading-header';
import { AdminLayoutContent } from './layout-content';

/**
 * Admin Layout - Suspense Pattern for Dynamic Data
 *
 * This layout uses Suspense boundary to prevent "Uncached data accessed outside of Suspense" errors.
 * Pattern: Layout (sync) → Suspense → LayoutContent (async, fetches user) → Children
 *
 * NO auth/admin checks or redirects - these are in page components using DAL.
 * Pages in this route group should call requireAdmin().
 *
 * FIXES: Next.js 16 + Turbopack error by wrapping async cookie access in Suspense.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LoadingHeader />}>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </div>
  );
}
