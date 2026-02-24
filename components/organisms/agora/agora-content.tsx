'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProposalCard } from '@/components/molecules/proposal-card';
import { ProposalKanbanBoard } from './proposal-kanban-board';
import { AgoraViewToggle, type AgoraViewMode } from './agora-view-toggle';
import { ROUTES } from '@/lib/utils/constants';
import { Plus } from 'lucide-react';
import type { ProposalTag } from '@/types/proposals';
import type { PROPOSAL_STATUS } from '@/lib/utils/constants';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  upvotes: number;
  score: number;
  view_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  category: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  tags?: ProposalTag[];
}

interface AgoraContentProps {
  proposals: Proposal[];
  total: number;
  currentPage: number;
  totalPages: number;
  searchParams: {
    category?: string;
    status?: string;
    search?: string;
    sort?: string;
  };
}

/**
 * AgoraContent Component
 *
 * Client component that manages view state (grid vs kanban)
 * and renders the appropriate view.
 */
export function AgoraContent({
  proposals,
  total,
  currentPage,
  totalPages,
  searchParams,
}: AgoraContentProps) {
  const [view, setView] = React.useState<AgoraViewMode>('grid');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <AgoraViewToggle view={view} onViewChange={setView} />
        <div className="text-sm text-slate-500">
          {total} {total === 1 ? 'proposta' : 'proposte'}
        </div>
      </div>

      {/* Content based on view mode */}
      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border">
          <p className="text-muted-foreground mb-4">
            Nessuna proposta trovata con i filtri selezionati.
          </p>
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20" asChild>
            <Link href={`${ROUTES.AGORA}/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Crea la prima proposta
            </Link>
          </Button>
        </div>
      ) : view === 'kanban' ? (
        <ProposalKanbanBoard proposals={proposals} />
      ) : (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>

          {/* Pagination (only for grid view) */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {currentPage > 1 ? (
                <Button variant="outline" className="rounded-full" asChild>
                  <Link
                    href={{
                      pathname: ROUTES.AGORA,
                      query: {
                        ...(searchParams.category && { category: searchParams.category }),
                        ...(searchParams.status && { status: searchParams.status }),
                        ...(searchParams.search && { search: searchParams.search }),
                        ...(searchParams.sort && { sort: searchParams.sort }),
                        page: currentPage - 1,
                      },
                    }}
                  >
                    Precedente
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="rounded-full" disabled>
                  Precedente
                </Button>
              )}

              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Button variant="outline" className="rounded-full" asChild>
                  <Link
                    href={{
                      pathname: ROUTES.AGORA,
                      query: {
                        ...(searchParams.category && { category: searchParams.category }),
                        ...(searchParams.status && { status: searchParams.status }),
                        ...(searchParams.search && { search: searchParams.search }),
                        ...(searchParams.sort && { sort: searchParams.sort }),
                        page: currentPage + 1,
                      },
                    }}
                  >
                    Successivo
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="rounded-full" disabled>
                  Successivo
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
