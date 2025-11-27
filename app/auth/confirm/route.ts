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
  const next = searchParams.get('next');

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

  // Success! Determine redirect destination based on type and user state
  let redirectPath: string;

  // For signup confirmations, check onboarding status and redirect appropriately
  if (type === 'signup' || type === 'email') {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        // User needs to complete onboarding first
        redirectPath = ROUTES.ONBOARDING;
      } else {
        // User completed onboarding - go to bacheca (not home to avoid mobile redirect)
        redirectPath = ROUTES.BACHECA;
      }
    } else {
      // No user session (shouldn't happen after verifyOtp success)
      redirectPath = ROUTES.LOGIN;
    }
  } else if (type === 'recovery') {
    // Password recovery - go to reset password page
    redirectPath = next || ROUTES.RESET_PASSWORD;

    // Handle full URLs by extracting pathname
    if (redirectPath.startsWith('http')) {
      try {
        const url = new URL(redirectPath);
        redirectPath = url.pathname || ROUTES.RESET_PASSWORD;
      } catch {
        redirectPath = ROUTES.RESET_PASSWORD;
      }
    }
  } else {
    // Other types (magiclink, invite) - use next param or default to home
    redirectPath = next || ROUTES.HOME;

    // Handle full URLs by extracting pathname
    if (redirectPath.startsWith('http')) {
      try {
        const url = new URL(redirectPath);
        redirectPath = url.pathname || ROUTES.HOME;
      } catch {
        redirectPath = ROUTES.HOME;
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
