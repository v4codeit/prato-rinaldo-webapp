import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/utils/constants';

/**
 * Auth Confirm Route Handler
 *
 * Handles email confirmations with token_hash (NOT code).
 * Used for:
 * - Password recovery (type=recovery)
 * - Email verification (type=signup)
 * - Magic links (type=magiclink)
 * - Invitations (type=invite)
 *
 * The email template must be configured to use token_hash:
 * <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">
 *
 * @see https://supabase.com/docs/guides/auth/auth-email-templates
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'magiclink' | 'invite' | 'email';
  const next = searchParams.get('next') ?? ROUTES.HOME;

  // Validate required parameters
  if (!token_hash || !type) {
    console.error('Auth confirm: Missing token_hash or type');
    return NextResponse.redirect(
      `${origin}${ROUTES.HOME}?error=invalid_request&error_code=missing_params&error_description=${encodeURIComponent('Parametri mancanti nella richiesta')}`
    );
  }

  const supabase = await createClient();

  // Verify the OTP token and get session
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) {
    console.error('Auth confirm: Error verifying OTP:', error);

    // Map Supabase error codes to user-friendly error codes
    let errorCode = error.code || 'verification_failed';

    // Handle common error scenarios
    if (error.message?.includes('expired')) {
      errorCode = 'otp_expired';
    } else if (error.message?.includes('invalid')) {
      errorCode = 'invalid_request';
    }

    // Redirect to home with error params (handled by AuthErrorHandler)
    return NextResponse.redirect(
      `${origin}${ROUTES.HOME}?error=${error.name}&error_code=${errorCode}&error_description=${encodeURIComponent(error.message)}`
    );
  }

  // Success! Redirect to the intended destination
  // Handle both full URLs (http://localhost:3000) and relative paths (/reset-password)
  let redirectPath: string = ROUTES.HOME;

  if (next) {
    try {
      // If next is a full URL (e.g., http://localhost:3000), extract only the pathname
      const url = new URL(next);
      redirectPath = url.pathname || ROUTES.HOME;
    } catch {
      // If not a valid URL, treat it as a relative path
      redirectPath = next.startsWith('/') ? next : `/${next}`;
    }
  }

  // If path is just "/" or empty for recovery, go to reset-password
  if (type === 'recovery' && (redirectPath === '/' || redirectPath === '')) {
    redirectPath = ROUTES.RESET_PASSWORD;
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
