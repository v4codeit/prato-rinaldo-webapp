import { Suspense } from 'react';
import { ResetPasswordContent } from './reset-password-content';
import { AuthCardSkeleton } from '../auth-card-skeleton';

export const metadata = {
  title: 'Reimposta Password',
  description: 'Inserisci la tua nuova password',
};

/**
 * Reset Password Page - Sync wrapper with Suspense
 *
 * Uses page-level Suspense for dynamic rendering.
 * Note: This page does NOT redirect authenticated users because
 * users MUST be authenticated (via recovery link) to reset password.
 *
 * Pattern: Page (sync) → Suspense → ResetPasswordContent (async) → ResetPasswordForm (client)
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
