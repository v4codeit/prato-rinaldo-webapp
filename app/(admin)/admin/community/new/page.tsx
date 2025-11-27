import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { TopicFormClient } from '../topic-form-client';

export const metadata = {
  title: 'Nuovo Topic - Admin',
  description: 'Crea un nuovo topic per la community',
};

export default async function NewTopicPage() {
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

  return (
    <AdminPageLayout
      backLink={{
        href: '/admin/community',
        label: 'Torna ai topic',
      }}
    >
      <TopicFormClient mode="create" />
    </AdminPageLayout>
  );
}
