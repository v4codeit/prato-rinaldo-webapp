import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';
import { signUp } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

/**
 * RegisterForm - Server Component with form UI
 *
 * Renders the registration form with Server Action and Google OAuth.
 * Auth check is handled by RegisterContent wrapper.
 */
export function RegisterForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrati</CardTitle>
        <CardDescription>
          Crea un account per unirti alla community
        </CardDescription>
      </CardHeader>

      {/* Google Sign-Up First - Better UX */}
      <CardContent className="space-y-4 pb-0">
        <GoogleSignInButton mode="signup" />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              oppure registrati con email
            </span>
          </div>
        </div>
      </CardContent>

      <form action={signUp as unknown as (formData: FormData) => void}>
        <CardContent className="space-y-4 pt-4">
          <FormField
            label="Nome completo"
            name="name"
            type="text"
            placeholder="Mario Rossi"
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="nome@esempio.com"
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
          <FormField
            label="Conferma password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full">
            Registrati
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Hai già un account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-primary hover:underline"
            >
              Accedi
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
