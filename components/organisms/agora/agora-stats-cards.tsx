import { Vote, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { PROPOSAL_STATUS } from '@/lib/utils/constants';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

interface AgoraStatsCardsProps {
  proposals: Array<{
    status: ProposalStatus;
    upvotes: number;
  }>;
  total: number;
}

/**
 * AgoraStatsCards Component
 *
 * Displays key metrics in a modern card layout:
 * - Active proposals count (gradient card)
 * - Total votes / Completed count (white cards)
 */
export function AgoraStatsCards({ proposals, total }: AgoraStatsCardsProps) {
  // Calculate stats
  const activeCount = proposals.filter(
    (p) => p.status === PROPOSAL_STATUS.PROPOSED || p.status === PROPOSAL_STATUS.UNDER_REVIEW
  ).length;

  const completedCount = proposals.filter(
    (p) => p.status === PROPOSAL_STATUS.COMPLETED
  ).length;

  const inProgressCount = proposals.filter(
    (p) => p.status === PROPOSAL_STATUS.IN_PROGRESS || p.status === PROPOSAL_STATUS.APPROVED
  ).length;

  const totalVotes = proposals.reduce((sum, p) => sum + p.upvotes, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Proposals - Gradient Card */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg shadow-violet-500/20">
        <Vote className="h-7 w-7 mb-3 opacity-80" />
        <div className="text-3xl font-bold">{activeCount}</div>
        <div className="text-sm opacity-80">Proposte Attive</div>
      </div>

      {/* In Progress - White Card */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm">
        <Clock className="h-7 w-7 mb-3 text-blue-500" />
        <div className="text-3xl font-bold text-slate-900">{inProgressCount}</div>
        <div className="text-sm text-slate-500">In Lavorazione</div>
      </div>

      {/* Completed - White Card */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm">
        <CheckCircle2 className="h-7 w-7 mb-3 text-emerald-500" />
        <div className="text-3xl font-bold text-slate-900">{completedCount}</div>
        <div className="text-sm text-slate-500">Completate</div>
      </div>

      {/* Total Votes - White Card */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm">
        <TrendingUp className="h-7 w-7 mb-3 text-amber-500" />
        <div className="text-3xl font-bold text-slate-900">{totalVotes}</div>
        <div className="text-sm text-slate-500">Voti Totali</div>
      </div>
    </div>
  );
}
