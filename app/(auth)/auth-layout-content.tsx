import { connection } from 'next/server';
import { headers } from 'next/headers';
import { redirectIfAuthenticated } from '@/lib/auth/dal';

/**
 * AuthLayoutContent - Async Server Component for auth redirect check
 *
 * Uses connection() to force dynamic rendering at request time.
 * Checks if user is already authenticated and redirects to home.
 * Wrapped in Suspense by the parent layout.
 *
 * Note: verify-email page is excluded from redirect because it needs
 * to handle authenticated users (to check email verification status).
 *
 * Pattern: Layout (sync) → Suspense → LayoutContent (async + dynamic) → Children
 */
export async function AuthLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering - excludes from prerendering
  await connection();

  // Get current path from headers
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

  // Skip redirect for verify-email page (needs to handle authenticated users)
  const isVerifyEmailPage = pathname.includes('/verify-email');

  if (!isVerifyEmailPage) {
    // Redirect authenticated users away from login/register pages
    await redirectIfAuthenticated();
  }

  return <>{children}</>;
}
