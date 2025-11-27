import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProposalById, getProposalCategories } from '@/app/actions/proposals';
import { ROUTES, VERIFICATION_STATUS } from '@/lib/utils/constants';
import { ProposalEditForm } from './proposal-edit-form';

/**
 * Proposal Edit Page - Author only, proposed status only
 *
 * Features:
 * - Loads existing proposal data
 * - Pre-populates all form fields
 * - Validates author access
 * - Only editable if status === 'proposed'
 * - Updates proposal on submission
 * - Redirects to proposal detail on success
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { proposal } = await getProposalById(id);

  if (!proposal) {
    return {
      title: 'Proposta non trovata',
    };
  }

  return {
    title: `Modifica ${proposal.title}`,
    description: `Modifica la proposta: ${proposal.title}`,
  };
}

export default async function ProposalEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get current user and check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${ROUTES.LOGIN}?redirect=/agora/${id}/edit`);
  }

  // Check verification status
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .single() as { data: { verification_status: string } | null };

  const isVerified = profile?.verification_status === VERIFICATION_STATUS.APPROVED;

  if (!isVerified) {
    redirect(ROUTES.AGORA);
  }

  // Get proposal data
  const { proposal } = await getProposalById(id);

  if (!proposal) {
    notFound();
  }

  // Check if user is the author
  if (proposal.author_id !== user.id) {
    redirect(`${ROUTES.AGORA}/${id}`); // Not authorized, redirect to proposal detail
  }

  // Check if proposal can be edited (only proposed status)
  if (proposal.status !== 'proposed') {
    redirect(`${ROUTES.AGORA}/${id}`); // Can't edit after review, redirect to detail
  }

  // Get categories for dropdown
  const { categories } = await getProposalCategories();

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modifica Proposta</h1>
        <p className="text-muted-foreground">
          Aggiorna i dettagli della tua proposta. Tutti i campi sono obbligatori.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Nota: Puoi modificare la proposta solo finché è in stato "Proposta". Una volta in revisione, non sarà più modificabile.
        </p>
      </div>

      <ProposalEditForm proposal={proposal} categories={categories} />
    </div>
  );
}
