import { connection } from 'next/server';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getAdminUserDetail,
  getAdminUserActivity,
  getUserBadges,
  getUserPoints,
} from '@/app/actions/users';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UserDetailClient } from './user-detail-client';
import { ROUTES } from '@/lib/utils/constants';

interface UserDetailContentProps {
  userId: string;
}

export async function UserDetailContent({ userId }: UserDetailContentProps) {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  const [userDetailResult, activityResult, badgesResult, pointsResult] = await Promise.all([
    getAdminUserDetail(userId),
    getAdminUserActivity(userId),
    getUserBadges(userId),
    getUserPoints(userId),
  ]);

  if (userDetailResult.error || !userDetailResult.user) {
    notFound();
  }

  return (
    <AdminPageLayout
      backLink={{
        href: ROUTES.ADMIN_USERS,
        label: 'Torna agli utenti',
      }}
    >
      <UserDetailClient
        user={userDetailResult.user}
        activity={activityResult.activity}
        badges={badgesResult.badges}
        points={pointsResult}
      />
    </AdminPageLayout>
  );
}
