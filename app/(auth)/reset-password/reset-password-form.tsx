'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { resetPassword } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';
import { KeyRound, CheckCircle } from 'lucide-react';

/**
 * ResetPasswordForm - Client Component with form UI and local state
 *
 * Handles password reset with loading/success/error states.
 * This page is accessed after user clicks the password recovery link in email.
 *
 * Flow:
 * 1. User requests password reset (forgot-password page)
 * 2. User clicks link in email
 * 3. Supabase redirects to /auth/callback?code=...&type=recovery
 * 4. /auth/callback exchanges code for session and redirects here
 * 5. User enters new password
 * 6. resetPassword action calls supabase.auth.updateUser({ password })
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 3000);
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 w-16 h-16 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-center">Password Aggiornata</CardTitle>
          <CardDescription className="text-center">
            La tua password è stata reimpostata con successo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <p className="text-sm text-center">
              Verrai reindirizzato alla pagina di login tra pochi secondi...
            </p>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="mx-auto mb-4 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-center">Reimposta Password</CardTitle>
        <CardDescription className="text-center">
          Inserisci la tua nuova password
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          )}
          <FormField
            label="Nuova Password"
            name="password"
            type="password"
            placeholder="Minimo 8 caratteri"
            required
          />
          <FormField
            label="Conferma Password"
            name="confirmPassword"
            type="password"
            placeholder="Ripeti la password"
            required
          />
          <p className="text-xs text-muted-foreground">
            La password deve contenere almeno 8 caratteri.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Aggiornamento...' : 'Reimposta Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
