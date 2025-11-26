import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { signUp } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Registrati',
  description: 'Crea un nuovo account',
};

/**
 * Register Page - Sync component (no cookies access)
 *
 * Auth redirect check is handled by AuthLayoutContent in the parent layout.
 * This page only renders the registration form UI.
 */
export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrati</CardTitle>
        <CardDescription>
          Crea un account per unirti alla community
        </CardDescription>
      </CardHeader>
      <form action={signUp as unknown as (formData: FormData) => void}>
        <CardContent className="space-y-4">
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
