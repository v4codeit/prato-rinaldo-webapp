import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAllAnnouncements, type Announcement } from '@/app/actions/announcements';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { AnnouncementsClient } from './announcements-client';

export const metadata = {
  title: 'Gestione Annunci - Admin',
  description: 'Gestisci banner e annunci del mobile menu',
};

export default async function AnnouncementsAdminPage() {
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

  const { announcements } = await getAllAnnouncements();
  const validAnnouncements = announcements as Announcement[];

  return (
    <AdminPageLayout>
      <AnnouncementsClient announcements={validAnnouncements} />
    </AdminPageLayout>
  );
}
