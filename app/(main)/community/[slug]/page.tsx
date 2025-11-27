import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TopicChatContent } from './topic-chat-content';
import { TopicChatSkeleton } from './topic-chat-skeleton';

interface TopicChatPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Topic Chat Page - Individual topic chat view
 */
export default async function TopicChatPage({ params }: TopicChatPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <Suspense fallback={<TopicChatSkeleton />}>
      <TopicChatContent slug={slug} />
    </Suspense>
  );
}

// Generate metadata
export async function generateMetadata({ params }: TopicChatPageProps) {
  const { slug } = await params;

  return {
    title: `${slug} | Community`,
    description: `Chat nel topic ${slug}`,
  };
}
