import { Suspense } from 'react';
import { CommunityPageContent } from './community-content';
import { CommunityPageSkeleton } from './community-skeleton';

/**
 * Community Page - List of all topics
 * On desktop: shows sidebar with topics list
 * On mobile: shows full list, selecting a topic navigates to chat
 */
export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityPageSkeleton />}>
      <CommunityPageContent />
    </Suspense>
  );
}
