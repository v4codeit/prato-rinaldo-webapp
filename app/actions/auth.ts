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
    return { error: 'Credenziali non valide' };
  }

  // Check if user has completed onboarding
  const { data: user } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
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

  // Create user profile (the auth.users trigger should handle this, but we ensure it)
  const defaultTenantId = '00000000-0000-0000-0000-000000000001'; // Prato Rinaldo

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    tenant_id: defaultTenantId,
    name: parsed.data.name,
    email: parsed.data.email,
    role: 'user',
    verification_status: 'pending',
    onboarding_completed: false,
    onboarding_step: 0,
  });

  if (profileError) {
    console.error('Profile creation error:', profileError);
    // Continue anyway - the user is created in auth
  }

  revalidatePath('/', 'layout');

  // Redirect to email verification page or onboarding
  redirect(ROUTES.VERIFY_EMAIL);
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(ROUTES.HOME);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: 'Email non valida' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.RESET_PASSWORD}`,
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
    redirect(ROUTES.HOME);
  }

  return { success: true };
}
