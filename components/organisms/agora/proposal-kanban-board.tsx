'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { ProposalTagBadge, ProposalTagBadgeGroup } from '@/components/atoms/proposal-tag-badge';
import { ArrowUp, Eye, Calendar, MessageSquare } from 'lucide-react';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { getShortName } from '@/lib/utils/format';
import type { ProposalTag } from '@/types/proposals';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

interface ProposalForKanban {
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

interface ProposalKanbanBoardProps {
  proposals: ProposalForKanban[];
}

// Column configuration with colors matching Featurebase-style
const KANBAN_COLUMNS: Array<{
  status: ProposalStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    status: PROPOSAL_STATUS.PROPOSED,
    label: 'Proposte',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    status: PROPOSAL_STATUS.UNDER_REVIEW,
    label: 'In Valutazione',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    status: PROPOSAL_STATUS.APPROVED,
    label: 'Approvate',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    status: PROPOSAL_STATUS.IN_PROGRESS,
    label: 'In Corso',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    status: PROPOSAL_STATUS.COMPLETED,
    label: 'Completate',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    status: PROPOSAL_STATUS.DECLINED,
    label: 'Respinte',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
];

/**
 * Kanban Card for a single proposal
 */
function KanbanCard({ proposal }: { proposal: ProposalForKanban }) {
  return (
    <Link href={`${ROUTES.AGORA}/${proposal.id}`}>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
        {/* Category Badge */}
        <Badge
          style={{ backgroundColor: proposal.category.color || '#0891b2' }}
          className="text-white border-0 px-2 py-0.5 text-[10px] font-medium rounded-lg mb-3"
        >
          {proposal.category.name}
        </Badge>

        {/* Title */}
        <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
          {proposal.title}
        </h4>

        {/* Description preview */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {proposal.description}
        </p>

        {/* Tags */}
        {proposal.tags && proposal.tags.length > 0 && (
          <div className="mb-3">
            <ProposalTagBadgeGroup className="gap-1">
              {proposal.tags.slice(0, 2).map((tag) => (
                <ProposalTagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </ProposalTagBadgeGroup>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <ArrowUp className={cn('h-3 w-3', proposal.upvotes > 0 ? 'text-emerald-500' : '')} />
              <span className={proposal.upvotes > 0 ? 'text-emerald-600 font-medium' : ''}>
                {proposal.upvotes}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{proposal.view_count}</span>
            </div>
          </div>
          <span className="text-slate-400 truncate max-w-[80px]">
            {getShortName(proposal.author.name)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Kanban Column
 */
function KanbanColumn({
  config,
  proposals,
}: {
  config: (typeof KANBAN_COLUMNS)[number];
  proposals: ProposalForKanban[];
}) {
  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className={cn('rounded-2xl px-4 py-3 mb-3', config.bgColor, 'border', config.borderColor)}>
        <div className="flex items-center justify-between">
          <span className={cn('font-semibold text-sm', config.color)}>
            {config.label}
          </span>
          <Badge variant="secondary" className="h-5 px-2 text-xs">
            {proposals.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="space-y-3 min-h-[200px]">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nessuna proposta
          </div>
        ) : (
          proposals.map((proposal) => (
            <KanbanCard key={proposal.id} proposal={proposal} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * ProposalKanbanBoard Component
 *
 * Displays proposals in a Featurebase-inspired Kanban board layout
 * with horizontal scrolling and status-based columns.
 */
export function ProposalKanbanBoard({ proposals }: ProposalKanbanBoardProps) {
  // Group proposals by status
  const proposalsByStatus = React.useMemo(() => {
    const grouped: Record<ProposalStatus, ProposalForKanban[]> = {
      [PROPOSAL_STATUS.PROPOSED]: [],
      [PROPOSAL_STATUS.UNDER_REVIEW]: [],
      [PROPOSAL_STATUS.APPROVED]: [],
      [PROPOSAL_STATUS.IN_PROGRESS]: [],
      [PROPOSAL_STATUS.COMPLETED]: [],
      [PROPOSAL_STATUS.DECLINED]: [],
    };

    proposals.forEach((proposal) => {
      if (grouped[proposal.status]) {
        grouped[proposal.status].push(proposal);
      }
    });

    return grouped;
  }, [proposals]);

  return (
    <div className="w-full">
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {KANBAN_COLUMNS.map((config) => (
            <KanbanColumn
              key={config.status}
              config={config}
              proposals={proposalsByStatus[config.status]}
            />
          ))}
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <div className="text-center text-xs text-slate-400 mt-2 md:hidden">
        Scorri orizzontalmente per vedere tutte le colonne
      </div>
    </div>
  );
}
