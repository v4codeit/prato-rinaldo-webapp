import { connection } from 'next/server';
import { ResetPasswordForm } from './reset-password-form';

/**
 * ResetPasswordContent - Async Server Component
 *
 * Uses connection() to force dynamic rendering at request time.
 *
 * Note: This page does NOT redirect authenticated users because
 * the user MUST be authenticated (via recovery link) to reset password.
 * The flow is:
 * 1. User clicks recovery link in email
 * 2. /auth/callback exchanges code for authenticated session
 * 3. User is redirected here with active session
 * 4. User submits new password
 *
 * Pattern: Page (sync) → Suspense → Content (async) → Form (client)
 */
export async function ResetPasswordContent() {
  await connection();

  return <ResetPasswordForm />;
}
