import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { getTopics } from '@/app/actions/topics';
import { ROUTES } from '@/lib/utils/constants';
import { CommunityClient } from './community-client';
import { formatTopicForList } from '@/types/topics';
import type { Route } from 'next';

/**
 * CommunityPageContent - Server Component
 * Fetches topics and renders the community layout
 */
export async function CommunityPageContent() {
  // Force dynamic rendering
  await connection();

  // Require verified resident
  const user = await requireVerifiedResident();

  // Fetch topics
  const { data: topics, error } = await getTopics();

  if (error || !topics) {
    // Handle error - show empty state
    return (
      <CommunityClient
        topics={[]}
        currentUserId={user.id}
        currentUserName={user.name || user.email}
        currentUserRole={user.role}
      />
    );
  }

  // Format topics for display
  const formattedTopics = topics.map(formatTopicForList);

  // On desktop, redirect to first topic if available
  // (This is handled client-side for mobile)

  return (
    <CommunityClient
      topics={formattedTopics}
      currentUserId={user.id}
      currentUserName={user.name || user.email}
      currentUserRole={user.role}
    />
  );
}
