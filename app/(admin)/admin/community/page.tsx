import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTopics } from '@/app/actions/topics';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { CommunityAdminClient } from './community-admin-client';
import { formatTopicForList } from '@/types/topics';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Gestione Community - Admin',
  description: 'Gestisci i topic della community',
};

export default async function CommunityAdminPage() {
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

  // Fetch all topics including archived
  const { data: topics } = await getTopics({ includeArchived: true });
  const formattedTopics = (topics || []).map(formatTopicForList);

  return (
    <AdminPageLayout
      actions={[
        {
          label: 'Nuovo Topic',
          href: '/admin/community/new',
          icon: Plus,
        },
      ]}
    >
      <CommunityAdminClient topics={formattedTopics} />
    </AdminPageLayout>
  );
}
