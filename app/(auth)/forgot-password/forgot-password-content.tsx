import { connection } from 'next/server';
import { redirectIfAuthenticated } from '@/lib/auth/dal';
import { ForgotPasswordForm } from './forgot-password-form';

/**
 * ForgotPasswordContent - Async Server Component for auth check
 *
 * Uses connection() to force dynamic rendering at request time.
 * Redirects authenticated users to home before rendering the form.
 *
 * Pattern: Page (sync) → Suspense → Content (async + redirect) → Form (client)
 */
export async function ForgotPasswordContent() {
  await connection();
  await redirectIfAuthenticated();

  return <ForgotPasswordForm />;
}
