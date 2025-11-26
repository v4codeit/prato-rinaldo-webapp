import { connection } from 'next/server';
import { redirectIfAuthenticated } from '@/lib/auth/dal';
import { RegisterForm } from './register-form';

/**
 * RegisterContent - Async Server Component for auth check
 *
 * Uses connection() to force dynamic rendering at request time.
 * Redirects authenticated users to home before rendering the form.
 *
 * Pattern: Page (sync) → Suspense → Content (async + redirect) → Form
 */
export async function RegisterContent() {
  await connection();
  await redirectIfAuthenticated();

  return <RegisterForm />;
}
