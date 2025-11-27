import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTopicBySlug } from '@/app/actions/topics';
import { getTopicMembers } from '@/app/actions/topic-members';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { TopicMembersClient } from './topic-members-client';
import { formatTopicForList } from '@/types/topics';
import { UserPlus } from 'lucide-react';

interface TopicMembersPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TopicMembersPageProps) {
  const { slug } = await params;
  return {
    title: `Membri ${slug} - Admin`,
    description: `Gestisci i membri del topic ${slug}`,
  };
}

export default async function TopicMembersPage({ params }: TopicMembersPageProps) {
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
  const { data: topic, error: topicError } = await getTopicBySlug(slug);

  if (topicError || !topic) {
    notFound();
  }

  // Fetch members
  const { data: members } = await getTopicMembers(topic.id);

  const formattedTopic = formatTopicForList(topic);

  return (
    <AdminPageLayout
      backLink={{
        href: `/admin/community/${slug}`,
        label: 'Torna al topic',
      }}
    >
      <TopicMembersClient
        topic={formattedTopic}
        members={members || []}
      />
    </AdminPageLayout>
  );
}
