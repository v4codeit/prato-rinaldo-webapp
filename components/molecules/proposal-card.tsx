import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProposalStatusBadge } from '@/components/atoms/proposal-status-badge';
import { ArrowUp, MessageSquare, Eye, Calendar } from 'lucide-react';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { getShortName } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    status: ProposalStatus;
    upvotes: number;
    downvotes: number;
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
  };
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const score = proposal.upvotes - proposal.downvotes;

  return (
    <Link href={`${ROUTES.AGORA}/${proposal.id}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden group">
        <div className="flex h-full">
          {/* Vote Column */}
          <div className="w-16 bg-slate-50 flex flex-col items-center justify-center gap-1 border-r border-slate-100 group-hover:bg-teal-50/50 transition-colors">
            <ArrowUp className={cn("h-6 w-6 transition-colors", score > 0 ? "text-teal-600" : "text-slate-400")} />
            <span className={cn("text-xl font-bold", score > 0 ? "text-teal-700" : "text-slate-600")}>
              {score}
            </span>
            <span className="text-[10px] uppercase text-slate-400 font-medium">Voti</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <Badge
                style={{ backgroundColor: proposal.category.color || '#0891b2' }}
                className="text-white border-0 px-2 py-0.5 text-xs font-medium rounded-lg"
              >
                {proposal.category.name}
              </Badge>
              <ProposalStatusBadge status={proposal.status} />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-teal-700 transition-colors">
              {proposal.title}
            </h3>

            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
              {proposal.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">
                  {getShortName(proposal.author.name)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{proposal.view_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(proposal.created_at).toLocaleDateString('it-IT')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
