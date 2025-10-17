import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../../../../lib/supabase/client';
import { useLocation } from 'wouter';

// Schema di validazione con Zod
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
  confirmPassword: z
    .string()
    .min(1, 'Conferma la password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      // Aggiorna la password dell'utente corrente
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;
      
      setSuccess(true);
      
      // Redirect al login dopo 2 secondi
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Errore durante il reset della password. Riprova.');
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>
            <strong>Password aggiornata!</strong>
            <p className="mt-2">
              La tua password è stata reimpostata con successo. Verrai reindirizzato al login...
            </p>
          </AlertDescription>
        </Alert>
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
          Inserisci la tua nuova password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nuova password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          aria-invalid={errors.password ? 'true' : 'false'}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Almeno 8 caratteri, con maiuscole, minuscole e numeri
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Conferma nuova password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Aggiornamento in corso...' : 'Reimposta password'}
      </Button>
    </form>
  );
}

