import { Suspense } from 'react';
import { FeedContent } from './feed-content';
import { FeedSkeleton } from './feed-skeleton';

export const metadata = {
  title: 'Bacheca Pubblica',
  description: 'Le ultime novità dalla community di Prato Rinaldo',
};

interface FeedPageProps {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent searchParams={params} />
    </Suspense>
  );
}
