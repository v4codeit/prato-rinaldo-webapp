import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useLocation } from 'wouter';

// Schema di validazione con Zod
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(50, 'Il nome non può superare 50 caratteri'),
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Inserisci un indirizzo email valido'),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
  confirmPassword: z
    .string()
    .min(1, 'Conferma la password'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Devi accettare i termini e le condizioni',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [, setLocation] = useLocation();
  const { signUp, loading } = useSupabaseAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setSuccess(false);
      
      await signUp(data.email, data.password, {
        name: data.name,
      });
      
      setSuccess(true);
      
      // Redirect alla pagina di verifica email
      setTimeout(() => {
        setLocation('/auth/verify-email');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Gestione errori specifici
      if (err.message?.includes('User already registered')) {
        setError('Questa email è già registrata. Prova ad accedere o usa un\'altra email.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('La password non soddisfa i requisiti minimi di sicurezza.');
      } else {
        setError(err.message || 'Errore durante la registrazione. Riprova.');
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
          <AlertDescription>
            Registrazione completata! Controlla la tua email per confermare l'account.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          type="text"
          placeholder="Mario Rossi"
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
          disabled={isSubmitting || loading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
        <p className="text-xs text-muted-foreground">
          Almeno 8 caratteri, con maiuscole, minuscole e numeri
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Conferma password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          disabled={isSubmitting || loading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
          disabled={isSubmitting || loading}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="acceptTerms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accetto i{' '}
            <a href="/privacy" className="text-primary hover:underline" target="_blank">
              termini e le condizioni
            </a>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || loading}
      >
        {isSubmitting || loading ? 'Registrazione in corso...' : 'Registrati'}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Hai già un account? </span>
        <a href="/login" className="text-primary hover:underline font-medium">
          Accedi
        </a>
      </div>
    </form>
  );
}

