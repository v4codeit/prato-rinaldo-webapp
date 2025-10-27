import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/organisms/header/header';
import { Footer } from '@/components/organisms/footer/footer';
import { ROUTES } from '@/lib/utils/constants';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, admin_role, verification_status')
    .eq('id', user.id)
    .single() as { data: { role: string; admin_role: string | null; verification_status: string } | null };

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const isModerator = profile?.admin_role === 'moderator';

  if (!isAdmin && !isModerator) {
    redirect(ROUTES.HOME);
  }

  const userWithVerification = {
    id: user.id,
    name: user.user_metadata?.name || user.email,
    verification_status: profile?.verification_status,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={userWithVerification} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
