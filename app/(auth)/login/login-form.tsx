'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';
import { AlertCircle, Mail } from 'lucide-react';

interface ActionState {
  error?: string;
  errorCode?: string;
}

/**
 * LoginForm - Client Component with form UI and error handling
 *
 * Renders the login form with Server Action, Google OAuth, and error display.
 * Auth check is handled by LoginContent wrapper.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await signIn(formData);
      return result || {};
    },
    {}
  );

  const isEmailNotConfirmed = state.errorCode === 'email_not_confirmed';

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-slate-800">Accedi</CardTitle>
        <CardDescription className="text-slate-500">
          Benvenuto! Inserisci le tue credenziali per accedere
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4 p-8 pt-4">
          {/* Error Alert */}
          {state.error && (
            <Alert variant={isEmailNotConfirmed ? 'default' : 'destructive'} className="rounded-xl">
              {isEmailNotConfirmed ? (
                <Mail className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className="ml-2">
                {state.error}
                {isEmailNotConfirmed && (
                  <Link
                    href={ROUTES.VERIFY_EMAIL}
                    className="block mt-2 text-teal-600 hover:text-teal-700 font-medium underline"
                  >
                    Vai alla pagina di verifica email
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="nome@esempio.com"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />

          <div className="flex justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Password dimenticata?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-8 pt-0">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 h-12 text-lg font-medium shadow-lg shadow-teal-600/20 disabled:opacity-50"
          >
            {isPending ? 'Accesso in corso...' : 'Accedi'}
          </Button>

          {/* Divider */}
          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/50 px-2 text-slate-400 backdrop-blur-sm">
                oppure
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <GoogleSignInButton mode="signin" className="w-full rounded-xl border-slate-200 hover:bg-white/50" />

          <div className="text-sm text-center text-slate-500 mt-4">
            Non hai un account?{' '}
            <Link
              href={ROUTES.REGISTER}
              className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
            >
              Registrati
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
