import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';
import { signIn } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

/**
 * LoginForm - Server Component with form UI
 *
 * Renders the login form with Server Action and Google OAuth.
 * Auth check is handled by LoginContent wrapper.
 */
export function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>
          Benvenuto! Inserisci le tue credenziali per accedere
        </CardDescription>
      </CardHeader>
      <form action={signIn as unknown as (formData: FormData) => void}>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full">
            Accedi
          </Button>

          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                oppure
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <GoogleSignInButton mode="signin" />

          <div className="flex flex-col space-y-2 text-sm text-center">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-muted-foreground hover:text-foreground"
            >
              Password dimenticata?
            </Link>
            <div className="text-muted-foreground">
              Non hai un account?{' '}
              <Link
                href={ROUTES.REGISTER}
                className="text-primary hover:underline"
              >
                Registrati
              </Link>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
