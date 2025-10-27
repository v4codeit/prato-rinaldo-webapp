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
    .select('role, admin_role')
    .eq('id', user.id)
    .single() as { data: { role: string; admin_role: string | null } | null };

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const isModerator = profile?.admin_role === 'moderator';

  if (!isAdmin && !isModerator) {
    redirect(ROUTES.HOME);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
