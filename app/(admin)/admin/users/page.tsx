import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers } from '@/app/actions/users';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UsersClient } from './users-client';

export const metadata = {
  title: 'Gestione Utenti - Admin',
  description: 'Visualizza e gestisci tutti gli utenti della piattaforma',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    role?: string;
    verification_status?: string;
    search?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const filters = {
    role: params.role,
    verification_status: params.verification_status,
    search: params.search,
  };

  const { users, total, error } = await getAllUsers(page, 50, filters);

  // Handle error or empty state
  if (error || !users) {
    return (
      <AdminPageLayout
        title="Gestione Utenti"
        description="Visualizza e gestisci tutti gli utenti della piattaforma"
        backLink={{ href: '/admin', label: 'Dashboard' }}
      >
        <div className="text-center py-12 text-destructive">
          {error || 'Errore durante il caricamento degli utenti'}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <UsersClient users={users as any[]} total={total} />
    </AdminPageLayout>
  );
}
