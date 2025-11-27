import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProposalCard } from '@/components/molecules/proposal-card';
import { ProposalFilters } from '@/components/molecules/proposal-filters';
import { getProposals, getProposalCategories } from '@/app/actions/proposals';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { Plus, MapPin } from 'lucide-react';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const metadata = {
  title: 'Agorà - Proposte Civiche',
  description: 'Proponi iniziative, vota le idee della community e segui la roadmap del comitato',
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container py-8">
      {/* Header Actions */}
      <div className="mb-8">
        <div className="flex justify-end gap-2">
            {/* Roadmap Link */}
            <Button variant="outline" asChild>
              <Link href={ROUTES.AGORA_ROADMAP}>
                <MapPin className="h-4 w-4 mr-2" />
                Roadmap
              </Link>
            </Button>

            {/* New Proposal Button - Always enabled for verified users */}
            <Button asChild>
              <Link href={`${ROUTES.AGORA}/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Proposta
              </Link>
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ProposalFilters categories={categories} />
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nessuna proposta trovata con i filtri selezionati.
          </p>
          <Button asChild>
            <Link href={`${ROUTES.AGORA}/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Crea la prima proposta
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {currentPage > 1 ? (
                <Button variant="outline" asChild>
                  <Link
                    href={{
                      pathname: ROUTES.AGORA,
                      query: {
                        ...(params.category && { category: params.category }),
                        ...(params.status && { status: params.status }),
                        ...(params.search && { search: params.search }),
                        ...(params.sort && { sort: params.sort }),
                        page: currentPage - 1,
                      },
                    }}
                  >
                    Precedente
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Precedente
                </Button>
              )}

              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Button variant="outline" asChild>
                  <Link
                    href={{
                      pathname: ROUTES.AGORA,
                      query: {
                        ...(params.category && { category: params.category }),
                        ...(params.status && { status: params.status }),
                        ...(params.search && { search: params.search }),
                        ...(params.sort && { sort: params.sort }),
                        page: currentPage + 1,
                      },
                    }}
                  >
                    Successivo
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Successivo
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Mostrate {proposals.length} di {total} proposte
          </div>
        </>
      )}
    </div>
  );
}
