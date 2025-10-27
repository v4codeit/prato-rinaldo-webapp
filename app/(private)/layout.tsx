import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/organisms/header/header';
import { Footer } from '@/components/organisms/footer/footer';
import { ROUTES, VERIFICATION_STATUS } from '@/lib/utils/constants';

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Check if onboarding is completed
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_completed, verification_status')
    .eq('id', user.id)
    .single() as { data: { onboarding_completed: boolean; verification_status: string } | null };

  if (profile && !profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  }

  // Private routes require verified resident status
  if (profile?.verification_status !== VERIFICATION_STATUS.APPROVED) {
    redirect(ROUTES.HOME);
  }

  const userWithVerification = {
    id: user.id,
    name: user.user_metadata?.name || user.email,
    verification_status: profile.verification_status,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={userWithVerification} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
