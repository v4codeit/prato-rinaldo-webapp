import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProposalStatusBadge } from '@/components/atoms/proposal-status-badge';
import { ArrowUp, MessageSquare, Eye, Calendar } from 'lucide-react';
import { ROUTES, PROPOSAL_STATUS } from '@/lib/utils/constants';
import { getShortName } from '@/lib/utils/format';

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
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-2">
            <Badge
              style={{ backgroundColor: proposal.category.color || '#0891b2' }}
              className="text-white"
            >
              {proposal.category.name}
            </Badge>
            <ProposalStatusBadge status={proposal.status} />
          </div>

          <CardTitle className="text-xl">{proposal.title}</CardTitle>

          <CardDescription className="line-clamp-2">
            {proposal.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              <span>di {getShortName(proposal.author.name)}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              {/* Score */}
              <div className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                <span className={score > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                  {score}
                </span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{proposal.view_count}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(proposal.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
