import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useLocation } from 'wouter';

// Schema di validazione con Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido'),
  password: z
    .string()
    .min(6, 'La password deve contenere almeno 6 caratteri'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [, setLocation] = useLocation();
  const { signInWithEmail, loading } = useSupabaseAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      await signInWithEmail(data.email, data.password);
      
      setSuccess(true);
      
      // Redirect dopo login
      setTimeout(() => {
        setLocation('/');
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Gestione errori specifici
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email o password non corretti');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Devi confermare la tua email prima di accedere. Controlla la tua casella di posta.');
      } else {
        setError(err.message || 'Errore durante il login. Riprova.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>Login effettuato con successo! Reindirizzamento...</AlertDescription>
        </Alert>
      )}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Password dimenticata?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          aria-invalid={errors.password ? 'true' : 'false'}
          disabled={isSubmitting || loading}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || loading}
      >
        {isSubmitting || loading ? 'Accesso in corso...' : 'Accedi'}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Non hai un account? </span>
        <a href="/register" className="text-primary hover:underline font-medium">
          Registrati
        </a>
      </div>
    </form>
  );
}

