import { Suspense } from 'react';
import { LoginContent } from './login-content';
import { AuthCardSkeleton } from '../auth-card-skeleton';

export const metadata = {
  title: 'Accedi',
  description: 'Accedi al tuo account',
};

/**
 * Login Page - Sync wrapper with Suspense
 *
 * Uses page-level Suspense for async auth check.
 * Pattern: Page (sync) → Suspense → LoginContent (async) → LoginForm
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
