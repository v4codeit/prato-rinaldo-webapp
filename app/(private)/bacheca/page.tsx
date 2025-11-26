import { requireVerifiedResident } from '@/lib/auth/dal';
import { getCurrentUser, getUserBadges, getUserPoints } from '@/app/actions/users';
import { getMyItems } from '@/app/actions/marketplace';
import { getMyProposals, getProposalCategories } from '@/app/actions/proposals';
import { getMyProfessionalProfile } from '@/app/actions/service-profiles';
import { getCategories } from '@/app/actions/categories';
import { getPrivateFeed } from '@/app/actions/feed';
import { BachecaClient } from './bacheca-client';
import type { BachecaStats, PointsStats } from '@/types/bacheca';

export const metadata = {
  title: 'Bacheca Personale',
  description: 'La tua bacheca personale su Prato Rinaldo',
};

interface BachecaPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function BachecaPage({ searchParams }: BachecaPageProps) {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();

  // Parse search params for feed filtering/sorting/pagination
  const params = await searchParams;
  const feedType = (params.type ?? 'all') as 'all' | 'event' | 'marketplace' | 'proposal';
  const feedSort = (params.sort ?? 'newest') as 'newest' | 'popular';
  const feedPage = parseInt(params.page ?? '1');

  // Parallel data fetching for optimal performance
  const [
    userResult,
    itemsResult,
    proposalsResult,
    proposalCategoriesResult,
    marketplaceCategoriesResult,
    professionalResult,
    badgesResult,
    pointsResult,
    feedData,
  ] = await Promise.all([
    getCurrentUser(),
    getMyItems(),
    getMyProposals(),
    getProposalCategories(),
    getCategories('marketplace_item'),
    getMyProfessionalProfile(),
    getUserBadges('current'),
    getUserPoints('current'),
    getPrivateFeed({
      type: feedType,
      sortBy: feedSort,
      limit: 20,
      offset: (feedPage - 1) * 20,
    }),
  ]);

  // Extract data from results
  // User is guaranteed to exist since requireVerifiedResident() redirects if not authenticated
  const user = userResult.user;
  if (!user) {
    // This should never happen due to requireVerifiedResident() above
    throw new Error('User not found');
  }
  const marketplaceItems = itemsResult.items || [];
  const proposals = proposalsResult.proposals || [];
  const proposalCategories = proposalCategoriesResult.categories || [];
  const marketplaceCategories = marketplaceCategoriesResult.categories || [];
  const professional = professionalResult.professional || null;
  const badges = badgesResult.badges || [];
  const rawPoints = pointsResult || { totalPoints: 0, level: 1 };

  // Convert points data to PointsStats type
  const points: PointsStats = {
    total: rawPoints.totalPoints,
    level: rawPoints.level,
  };

  // Calculate simplified statistics for tab badges only
  const stats: BachecaStats = {
    marketplace: {
      total: marketplaceItems.length,
    },
    proposals: {
      total: proposals.length,
    },
  };

  // Calculate professional stats separately
  const professionalStats = {
    exists: !!professional,
    status: professional?.status || null,
    reviewsCount: 0, // TODO: implement reviews system
  };

  return (
    <BachecaClient
      stats={stats}
      marketplaceItems={marketplaceItems}
      proposals={proposals}
      proposalCategories={proposalCategories}
      marketplaceCategories={marketplaceCategories}
      professional={professional}
      professionalStats={professionalStats}
      userProfile={user}
      badges={badges}
      points={points}
      feedItems={feedData.feedItems}
      feedHasMore={feedData.hasMore}
      feedTotal={feedData.total}
    />
  );
}
