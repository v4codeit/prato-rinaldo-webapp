import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { signIn } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Accedi',
  description: 'Accedi al tuo account',
};

/**
 * Login Page - Sync component (no cookies access)
 *
 * Auth redirect check is handled by AuthLayoutContent in the parent layout.
 * This page only renders the login form UI.
 */
export default function LoginPage() {
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
