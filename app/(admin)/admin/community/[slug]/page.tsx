import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTopicBySlug } from '@/app/actions/topics';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { TopicFormClient } from '../topic-form-client';
import { formatTopicForList } from '@/types/topics';

interface EditTopicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditTopicPageProps) {
  const { slug } = await params;
  return {
    title: `Modifica ${slug} - Admin`,
    description: `Modifica le impostazioni del topic ${slug}`,
  };
}

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const { slug } = await params;

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

  // Fetch topic
  const { data: topic, error } = await getTopicBySlug(slug);

  if (error || !topic) {
    notFound();
  }

  const formattedTopic = formatTopicForList(topic);

  return (
    <AdminPageLayout
      backLink={{
        href: '/admin/community',
        label: 'Torna ai topic',
      }}
    >
      <TopicFormClient mode="edit" topic={formattedTopic} />
    </AdminPageLayout>
  );
}
