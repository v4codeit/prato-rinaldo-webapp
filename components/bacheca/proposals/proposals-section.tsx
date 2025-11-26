'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, RefreshCw, ArrowUpDown, MessageSquare } from 'lucide-react';
import { ProposalWithActions, ProposalsFilters, SortOption } from '@/types/bacheca';
import { ProposalCard } from './proposal-card';
import { ProposalsFiltersPanel } from './proposals-filters';
import { ProposalCategory } from '@/app/actions/proposals';
import { toast } from 'sonner';

interface ProposalsSectionProps {
  proposals: ProposalWithActions[];
  categories: ProposalCategory[];
  onRefresh?: () => void;
}

/**
 * Sort proposals based on selected option
 */
function sortProposals(proposals: ProposalWithActions[], sortBy: SortOption): ProposalWithActions[] {
  const sorted = [...proposals];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'score':
      return sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'it'));
    default:
      return sorted;
  }
}

/**
 * Filter proposals based on active filters
 */
function filterProposals(proposals: ProposalWithActions[], filters: ProposalsFilters): ProposalWithActions[] {
  let filtered = [...proposals];

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((p) => p.status === filters.status);
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((p) => p.category_id === filters.category);
  }

  // Filter by search (title + description)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    );
  }

  // Filter by date range
  if (filters.date_from) {
    const fromDate = new Date(filters.date_from);
    filtered = filtered.filter((p) => new Date(p.created_at) >= fromDate);
  }

  if (filters.date_to) {
    const toDate = new Date(filters.date_to);
    toDate.setHours(23, 59, 59, 999); // Include entire day
    filtered = filtered.filter((p) => new Date(p.created_at) <= toDate);
  }

  return filtered;
}

export function ProposalsSection({ proposals, categories, onRefresh }: ProposalsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ProposalsFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Memoized filtered and sorted proposals
  const displayedProposals = useMemo(() => {
    const filtered = filterProposals(proposals, filters);
    return sortProposals(filtered, sortBy);
  }, [proposals, filters, sortBy]);

  const handleFilterChange = (newFilters: ProposalsFilters) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  };

  const handleSortChange = (value: SortOption) => {
    startTransition(() => {
      setSortBy(value);
    });
  };

  const handleRefresh = () => {
    onRefresh?.();
    toast.success('Proposte aggiornate');
  };

  const handleCreateProposal = () => {
    router.push('/agora/new');
  };

  const handleProposalDeleted = () => {
    // Trigger refresh from parent
    onRefresh?.();
  };

  // Detect screen size for auto view mode (mobile-first)
  // In production, you might want to use a resize observer or media query hook
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Le Mie Proposte Agorà</CardTitle>
              <CardDescription>
                Gestisci le tue proposte civiche e monitora il loro stato
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPending}
                aria-label="Aggiorna proposte"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
              <Button
                onClick={handleCreateProposal}
                size="sm"
                aria-label="Crea nuova proposta"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuova Proposta</span>
                <span className="sm:hidden">Crea</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtra e Cerca</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalsFiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
            totalCount={displayedProposals.length}
          />
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ordina per:</span>
        </div>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]" aria-label="Ordina proposte">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Più recenti</SelectItem>
            <SelectItem value="oldest">Meno recenti</SelectItem>
            <SelectItem value="score">Punteggio</SelectItem>
            <SelectItem value="title">Titolo (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Proposals List */}
      {displayedProposals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {proposals.length === 0 ? 'Nessuna proposta' : 'Nessun risultato'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {proposals.length === 0
                    ? 'Non hai ancora creato proposte. Inizia a contribuire alla community!'
                    : 'Nessuna proposta corrisponde ai filtri selezionati.'}
                </p>
                {proposals.length === 0 ? (
                  <Button onClick={handleCreateProposal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea la tua prima proposta
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setFilters({})}>
                    Cancella filtri
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View: Cards Grid */}
          <div className="md:hidden space-y-4">
            {displayedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onDelete={handleProposalDeleted}
                variant="mobile"
              />
            ))}
          </div>

          {/* Desktop View: Table-like */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="border-b bg-muted/50 p-4 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">Proposta</div>
                  <div className="col-span-2">Stato</div>
                  <div className="col-span-2">Voti</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-1 text-right">Azioni</div>
                </div>

                {/* Table Rows */}
                {displayedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onDelete={handleProposalDeleted}
                    variant="desktop"
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="text-center text-sm text-muted-foreground">
            Mostrate {displayedProposals.length} di {proposals.length} proposte totali
          </div>
        </>
      )}
    </div>
  );
}
