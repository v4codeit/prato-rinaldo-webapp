'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, forgotPasswordSchema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';

/**
 * Sign in with email and password
 */
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate input
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: 'Email o password non validi' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Check for specific error types
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Email not confirmed
    if (
      errorMessage.includes('email not confirmed') ||
      errorMessage.includes('email_not_confirmed') ||
      errorCode === 'email_not_confirmed'
    ) {
      return {
        error: 'Email non confermata. Controlla la tua casella di posta e clicca sul link di verifica.',
        errorCode: 'email_not_confirmed',
      };
    }

    // Invalid credentials (wrong password or email not found)
    return { error: 'Credenziali non valide' };
  }

  // Check if user has completed onboarding
  const { data: user } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
    .single() as { data: { onboarding_completed: boolean } | null };

  revalidatePath('/', 'layout');

  if (user && !user.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }

  // Redirect to personal bacheca after login
  redirect(ROUTES.BACHECA);
}

/**
 * Sign up with email and password
 */
export async function signUp(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate input
  const parsed = registerSchema.safeParse({ name, email, password, confirmPassword });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const supabase = await createClient();

  // Sign up user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (signUpError) {
    return { error: 'Errore durante la registrazione' };
  }

  if (!authData.user) {
    return { error: 'Errore durante la creazione dell\'utente' };
  }

  // User profile is automatically created by database trigger (handle_new_user)
  // The trigger creates a record in public.users with:
  // - tenant_id: default Prato Rinaldo tenant
  // - name: from raw_user_meta_data
  // - role: 'user'
  // - verification_status: 'pending'
  // - onboarding_completed: false

  revalidatePath('/', 'layout');

  // Redirect to email verification page or onboarding
  redirect(ROUTES.VERIFY_EMAIL);
}

/**
 * Sign out
 *
 * NOTE: Non usa redirect() perché non funziona correttamente con onClick
 * in client components. Il redirect viene fatto nel client.
 * @see https://github.com/vercel/next.js/issues/59163
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  // NON fare redirect qui - viene fatto nel client con window.location.href
}

/**
 * Request password reset
 *
 * The redirectTo parameter is used in the email template as {{ .RedirectTo }}
 * The email template must be configured to use token_hash approach:
 * <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">
 *
 * @see https://supabase.com/docs/guides/auth/auth-email-templates
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: 'Email non valida' };
  }

  const supabase = await createClient();

  // redirectTo viene usato nel template email come {{ .RedirectTo }}
  // Il template deve essere configurato per usare token_hash + /auth/confirm
  // Il path viene passato come "next" parameter nel link dell'email
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: ROUTES.RESET_PASSWORD,
  });

  if (error) {
    return { error: 'Errore durante l\'invio dell\'email' };
  }

  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Le password non coincidono' };
  }

  if (password.length < 8) {
    return { error: 'La password deve contenere almeno 8 caratteri' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: 'Errore durante il reset della password' };
  }

  revalidatePath('/', 'layout');
  redirect(ROUTES.LOGIN);
}

/**
 * Resend verification email
 *
 * Can be called by:
 * - Unauthenticated users (with email in formData)
 * - Authenticated users (uses session email)
 */
export async function resendVerificationEmail(formData?: FormData) {
  const supabase = await createClient();

  // Try to get email from authenticated session first
  const { data: { user } } = await supabase.auth.getUser();
  let email = user?.email;

  // If not authenticated, get email from formData
  if (!email && formData) {
    email = formData.get('email') as string;
  }

  if (!email) {
    return { error: 'Email non fornita' };
  }

  // Resend the verification email using Supabase's resend method
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    // Handle rate limiting
    if (error.message?.includes('rate') || error.message?.includes('limit')) {
      return { error: 'Troppi tentativi. Attendi qualche minuto prima di riprovare.' };
    }
    return { error: 'Errore durante l\'invio dell\'email. Riprova più tardi.' };
  }

  return { success: true, message: 'Email di verifica inviata!' };
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(step: number, data: Record<string, any>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Update user profile with onboarding data
  const updateData: Record<string, any> = {
    onboarding_step: step,
    ...data,
  };

  // If step 2 completed, mark onboarding as done
  if (step >= 2) {
    updateData.onboarding_completed = true;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del profilo' };
  }

  revalidatePath('/', 'layout');

  if (step >= 2) {
    redirect(ROUTES.BACHECA);
  }

  return { success: true };
}
