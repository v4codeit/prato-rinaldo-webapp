import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProposalFilters } from '@/components/molecules/proposal-filters';
import { AgoraStatsCards } from '@/components/organisms/agora/agora-stats-cards';
import { AgoraContent } from '@/components/organisms/agora/agora-content';
import { getProposals, getProposalCategories } from '@/app/actions/proposals';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { Plus } from 'lucide-react';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const metadata = {
  title: 'Agorà - Proposte Civiche',
  description: 'Proponi iniziative e vota le idee della community',
};

export default async function AgoraPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; search?: string; sort?: 'score' | 'created_at'; page?: string }>;
}) {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();

  // Await searchParams after authentication checks
  const params = await searchParams;

  // Get categories
  const { categories } = await getProposalCategories();

  // Get proposals with filters
  const currentPage = params.page ? parseInt(params.page) : 1;
  const limit = 12;

  const { proposals, total } = await getProposals({
    categoryId: params.category,
    status: params.status as ProposalStatus | undefined,
    search: params.search,
    sortBy: params.sort || 'score',
    page: currentPage,
    limit,
  });

  // Get all proposals for stats (without pagination)
  const { proposals: allProposals } = await getProposals({
    page: 1,
    limit: 1000, // Get all for stats
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container py-8 space-y-8">
      {/* Modern Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Agorà
          </h1>
          <p className="text-muted-foreground mt-1">
            Proponi iniziative e vota le idee della community
          </p>
        </div>
        {/* New Proposal Button */}
        <Button className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20" asChild>
          <Link href={`${ROUTES.AGORA}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Proposta
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <AgoraStatsCards proposals={allProposals} total={total} />

      {/* Filters */}
      <ProposalFilters categories={categories} />

      {/* Main Content with View Toggle */}
      <AgoraContent
        proposals={proposals}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        searchParams={{
          category: params.category,
          status: params.status,
          search: params.search,
          sort: params.sort,
        }}
      />
    </div>
  );
}
