import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getPendingUsers } from '@/app/actions/users';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UsersClient } from './users-client';

interface UsersContentProps {
  searchParams: {
    page?: string;
    role?: string;
    verification_status?: string;
    search?: string;
  };
}

export async function UsersContent({ searchParams }: UsersContentProps) {
  await connection(); // Force dynamic rendering - MUST be first

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

  const page = parseInt(searchParams.page || '1', 10);
  const filters = {
    role: searchParams.role,
    verification_status: searchParams.verification_status,
    search: searchParams.search,
  };

  // Fetch all users and pending users in parallel
  const [allUsersResult, pendingUsersResult] = await Promise.all([
    getAllUsers(page, 50, filters),
    getPendingUsers(),
  ]);

  const { users, total, error } = allUsersResult;
  const { users: pendingUsers } = pendingUsersResult;

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
      <UsersClient users={users as any[]} total={total} pendingUsers={pendingUsers} />
    </AdminPageLayout>
  );
}
