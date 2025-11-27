import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { getTopicBySlug, getTopics } from '@/app/actions/topics';
import { getTopicMessages } from '@/app/actions/topic-messages';
import { TopicChatClient } from './topic-chat-client';
import { formatTopicForList, canWriteToTopic } from '@/types/topics';

interface TopicChatContentProps {
  slug: string;
}

/**
 * TopicChatContent - Server Component
 * Fetches topic data and initial messages
 */
export async function TopicChatContent({ slug }: TopicChatContentProps) {
  // Force dynamic rendering
  await connection();

  // Require verified resident
  const user = await requireVerifiedResident();

  // Fetch topic by slug
  const { data: topic, error: topicError } = await getTopicBySlug(slug);

  if (topicError || !topic) {
    notFound();
  }

  // Fetch all topics for sidebar
  const { data: allTopics } = await getTopics();
  const formattedTopics = (allTopics || []).map(formatTopicForList);

  // Fetch initial messages
  const { data: messagesData } = await getTopicMessages(topic.id, {
    limit: 50,
  });
  const initialMessages = messagesData?.data || [];

  // Format topic for display
  const formattedTopic = formatTopicForList(topic);

  // Determine user's write permission
  const userRole =
    user.role === 'admin' || user.role === 'super_admin'
      ? 'admin'
      : user.verification_status === 'approved'
        ? 'verified'
        : 'authenticated';

  const canWrite = canWriteToTopic(formattedTopic, userRole as any);

  return (
    <TopicChatClient
      topic={formattedTopic}
      allTopics={formattedTopics}
      initialMessages={initialMessages}
      currentUserId={user.id}
      currentUserName={user.name || user.email}
      currentUserRole={user.role}
      canWrite={canWrite}
    />
  );
}
