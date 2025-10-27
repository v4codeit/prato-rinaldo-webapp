import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProposalCard } from '@/components/molecules/proposal-card';
import { ProposalFilters } from '@/components/molecules/proposal-filters';
import { VerificationRequired } from '@/components/molecules/verification-required';
import { getProposals, getProposalCategories } from '@/app/actions/proposals';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { Plus, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const metadata = {
  title: 'Agorà - Proposte Civiche',
  description: 'Proponi iniziative, vota le idee della community e segui la roadmap del comitato',
};

export default async function AgoraPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; sort?: 'score' | 'created_at'; page?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Agorà is private - only for verified residents
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .single() as { data: { verification_status: string } | null };

  const isVerified = profile?.verification_status === 'approved';

  if (!isVerified) {
    return (
      <VerificationRequired
        title="Solo Residenti Verificati"
        message="L'Agorà è riservata ai residenti verificati di Prato Rinaldo. Completa la verifica del tuo profilo per accedere alle proposte civiche e partecipare alla vita del quartiere."
      />
    );
  }

  // Get categories
  const { categories } = await getProposalCategories();

  // Get proposals with filters
  const { proposals, total } = await getProposals({
    categoryId: searchParams.category,
    status: searchParams.status as ProposalStatus | undefined,
    sortBy: searchParams.sort || 'score',
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 12,
  });

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agorà</h1>
            <p className="text-muted-foreground">
              Proponi iniziative, vota le idee della community e partecipa alla vita del quartiere
            </p>
          </div>

          <div className="flex gap-2">
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
          {total > 12 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" disabled>
                Precedente
              </Button>
              <Button variant="outline" disabled>
                Successivo
              </Button>
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
