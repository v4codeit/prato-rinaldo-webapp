import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Schema di validazione con Zod
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { resetPassword, loading } = useSupabaseAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      await resetPassword(data.email);
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Errore durante l\'invio dell\'email. Riprova.');
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>
            <strong>Email inviata!</strong>
            <p className="mt-2">
              Controlla la tua casella di posta. Ti abbiamo inviato un link per reimpostare la password.
            </p>
            <p className="mt-2 text-sm">
              Se non ricevi l'email entro pochi minuti, controlla la cartella spam.
            </p>
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a href="/login" className="text-sm text-primary hover:underline">
            Torna al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tuo@email.com"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
          disabled={isSubmitting || loading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || loading}
      >
        {isSubmitting || loading ? 'Invio in corso...' : 'Invia link di reset'}
      </Button>

      <div className="text-center text-sm">
        <a href="/login" className="text-primary hover:underline">
          Torna al login
        </a>
      </div>
    </form>
  );
}

