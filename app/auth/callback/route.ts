import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/utils/constants';

/**
 * Auth Callback Route Handler
 *
 * Handles Supabase PKCE auth callbacks for OAuth providers:
 * - OAuth callbacks (Google, GitHub, etc.) - uses `code` parameter
 * - Email verification via ConfirmationURL (implicit flow)
 *
 * NOTE: Password recovery uses /auth/confirm with token_hash instead!
 * This handler is for OAuth and legacy email flows with `code` parameter.
 *
 * The `code` parameter is exchanged for a session using `exchangeCodeForSession`.
 * The `next` parameter determines where to redirect after successful auth.
 *
 * For OAuth users (Google, etc.), this handler also:
 * - Extracts user info from provider metadata
 * - Updates user profile with name/avatar from OAuth provider
 *
 * @see https://supabase.com/docs/guides/auth/sessions/pkce-flow
 * @see https://supabase.com/docs/guides/auth/social-login/auth-google
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors (e.g., user cancelled consent)
  if (error) {
    console.error('Auth callback: OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}${ROUTES.LOGIN}?error=${error}&message=${encodeURIComponent(errorDescription || 'Autenticazione annullata')}`
    );
  }

  // If no code, redirect to home
  if (!code) {
    console.error('Auth callback: No code provided');
    return NextResponse.redirect(`${origin}${ROUTES.HOME}`);
  }

  const supabase = await createClient();

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Auth callback: Error exchanging code for session:', exchangeError);
    // Redirect to login with error message
    return NextResponse.redirect(
      `${origin}${ROUTES.LOGIN}?error=auth_callback_error&message=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // If next is specified (e.g., from password recovery), redirect there
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Default behavior: check user status and redirect appropriately
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if this is an OAuth user (has provider metadata)
    const isOAuthUser = user.app_metadata?.provider && user.app_metadata.provider !== 'email';

    // For OAuth users, update profile with provider data if not already set
    if (isOAuthUser) {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('name, avatar, onboarding_completed')
        .eq('id', user.id)
        .single();

      // If profile exists but name is empty, update with OAuth data
      if (existingProfile) {
        const updates: Record<string, string | boolean> = {};

        // Get name from OAuth provider metadata
        if (!existingProfile.name || existingProfile.name === '') {
          const oauthName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.preferred_username ||
            user.email?.split('@')[0] ||
            'Utente';
          updates.name = oauthName;
        }

        // Get avatar from OAuth provider and copy to Supabase Storage
        // (avoids HTTP 429 from Google CDN in production with many concurrent users)
        if (!existingProfile.avatar) {
          const oauthAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;
          if (oauthAvatar) {
            const { copyExternalAvatarToStorage } = await import(
              '@/lib/utils/avatar-storage'
            );
            const storedUrl = await copyExternalAvatarToStorage(
              oauthAvatar,
              user.id
            );
            if (storedUrl) {
              updates.avatar = storedUrl;
            }
          }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);
        }

        // Check onboarding status
        if (!existingProfile.onboarding_completed) {
          return NextResponse.redirect(`${origin}${ROUTES.ONBOARDING}`);
        }

        // User is fully onboarded - go to bacheca
        return NextResponse.redirect(`${origin}${ROUTES.BACHECA}`);
      }
    }

    // For email users or new profiles, check onboarding
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(`${origin}${ROUTES.ONBOARDING}`);
    }

    // User is fully onboarded - go to bacheca
    return NextResponse.redirect(`${origin}${ROUTES.BACHECA}`);
  }

  // No user (shouldn't happen after successful code exchange) - go home
  return NextResponse.redirect(`${origin}${ROUTES.HOME}`);
}
