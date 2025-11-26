import { Suspense } from 'react';
import { RegisterContent } from './register-content';
import { AuthCardSkeleton } from '../auth-card-skeleton';

export const metadata = {
  title: 'Registrati',
  description: 'Crea un nuovo account',
};

/**
 * Register Page - Sync wrapper with Suspense
 *
 * Uses page-level Suspense for async auth check.
 * Pattern: Page (sync) → Suspense → RegisterContent (async) → RegisterForm
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}
