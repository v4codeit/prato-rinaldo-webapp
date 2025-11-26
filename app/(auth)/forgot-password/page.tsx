import { Suspense } from 'react';
import { ForgotPasswordContent } from './forgot-password-content';
import { AuthCardSkeleton } from '../auth-card-skeleton';

export const metadata = {
  title: 'Password Dimenticata',
  description: 'Recupera la tua password',
};

/**
 * Forgot Password Page - Sync wrapper with Suspense
 *
 * Uses page-level Suspense for async auth check.
 * Pattern: Page (sync) → Suspense → ForgotPasswordContent (async) → ForgotPasswordForm (client)
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
