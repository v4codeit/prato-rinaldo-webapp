import { Header } from '@/components/organisms/header/header';
import { Footer } from '@/components/organisms/footer/footer';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user profile with verification_status if authenticated
  let userWithVerification = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    userWithVerification = {
      id: user.id,
      name: user.user_metadata?.name || user.email,
      verification_status: profile?.verification_status,
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={userWithVerification} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
