import { connection } from 'next/server';
import { redirectIfAuthenticated } from '@/lib/auth/dal';
import { LoginForm } from './login-form';

/**
 * LoginContent - Async Server Component for auth check
 *
 * Uses connection() to force dynamic rendering at request time.
 * Redirects authenticated users to home before rendering the form.
 *
 * Pattern: Page (sync) → Suspense → Content (async + redirect) → Form
 */
export async function LoginContent() {
  await connection();
  await redirectIfAuthenticated();

  return <LoginForm />;
}
