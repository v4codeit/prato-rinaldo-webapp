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
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-slate-800">Registrati</CardTitle>
        <CardDescription className="text-slate-500">
          Crea un account per unirti alla community
        </CardDescription>
      </CardHeader>

      {/* Google Sign-Up First - Better UX */}
      <CardContent className="space-y-4 pb-0 px-8">
        <GoogleSignInButton mode="signup" className="w-full rounded-xl border-slate-200 hover:bg-white/50" />

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/50 px-2 text-slate-400 backdrop-blur-sm">
              oppure registrati con email
            </span>
          </div>
        </div>
      </CardContent>

      <form action={signUp as unknown as (formData: FormData) => void}>
        <CardContent className="space-y-4 pt-4 px-8">
          <FormField
            label="Nome completo"
            name="name"
            type="text"
            placeholder="Mario Rossi"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="nome@esempio.com"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
          <FormField
            label="Conferma password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            className="rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-0">
          <Button type="submit" className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 h-12 text-lg font-medium shadow-lg shadow-teal-600/20">
            Registrati
          </Button>
          <div className="text-sm text-center text-slate-500">
            Hai già un account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
            >
              Accedi
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
