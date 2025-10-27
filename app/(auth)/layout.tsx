import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is already authenticated, redirect appropriately
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single() as { data: { onboarding_completed: boolean } | null };

    // If onboarding not completed, send to onboarding
    if (profile && !profile.onboarding_completed) {
      redirect(ROUTES.ONBOARDING);
    }

    // Otherwise redirect to home
    redirect(ROUTES.HOME);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/50 p-4">
      {/* Back to Home Button - Top Left */}
      <Button
        variant="outline"
        size="sm"
        asChild
        className="absolute top-4 left-4 hover:bg-primary/10 hover:text-primary hover:border-primary"
        aria-label="Torna alla Home"
      >
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo centrato */}
        <Link href={ROUTES.HOME} className="flex flex-col items-center space-y-3">
          <Image
            src="/assets/logos/logo-pratorinaldo.png"
            alt={APP_NAME}
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            priority
          />
          <h1 className="text-2xl font-bold text-center">{APP_NAME}</h1>
        </Link>

        {/* Auth Card */}
        {children}
      </div>
    </div>
  );
}
