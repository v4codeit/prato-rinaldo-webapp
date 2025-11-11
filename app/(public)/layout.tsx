import { Suspense } from 'react';
import { LoadingHeader } from '@/components/organisms/layout/loading-header';
import { PublicLayoutContent } from './layout-content';

/**
 * Public Layout - Suspense Pattern for Dynamic Data
 *
 * This layout uses Suspense boundary to prevent "Uncached data accessed outside of Suspense" errors.
 * Pattern: Layout (sync) → Suspense → LayoutContent (async, fetches user) → Children
 *
 * NO auth checks or redirects - public pages are accessible to everyone.
 * Auth/verification checks are performed in individual page components using DAL.
 *
 * FIXES: Next.js 16 + Turbopack error by wrapping async cookie access in Suspense.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LoadingHeader />}>
        <PublicLayoutContent>{children}</PublicLayoutContent>
      </Suspense>
    </div>
  );
}
