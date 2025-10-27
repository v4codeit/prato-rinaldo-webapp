'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { requestPasswordReset } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const result = await requestPasswordReset(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Inviata</CardTitle>
          <CardDescription>
            Controlla la tua casella di posta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <p className="text-sm">
              Ti abbiamo inviato un'email con le istruzioni per reimpostare la password.
              Se non ricevi l'email entro pochi minuti, controlla la cartella spam.
            </p>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={ROUTES.LOGIN}>Torna al Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Dimenticata</CardTitle>
        <CardDescription>
          Inserisci il tuo indirizzo email per ricevere le istruzioni
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
            label="Email"
            name="email"
            type="email"
            placeholder="nome@esempio.com"
            required
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Invio in corso...' : 'Invia Istruzioni'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            <Link
              href={ROUTES.LOGIN}
              className="text-primary hover:underline"
            >
              Torna al Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
