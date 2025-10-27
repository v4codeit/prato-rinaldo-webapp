'use client';

import { useState, useTransition } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { voteProposal } from '@/app/actions/proposals';
import { cn } from '@/lib/utils/cn';
import { useRouter } from 'next/navigation';

interface ProposalVoteWidgetProps {
  proposalId: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  className?: string;
}

export function ProposalVoteWidget({
  proposalId,
  upvotes,
  downvotes,
  userVote,
  className,
}: ProposalVoteWidgetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticVote, setOptimisticVote] = useState(userVote);

  const score = upvotes - downvotes;

  const handleVote = async (voteType: 'up' | 'down') => {
    // Optimistic update
    setOptimisticVote((current) => (current === voteType ? null : voteType));

    startTransition(async () => {
      const result = await voteProposal(proposalId, voteType);

      if (result.error) {
        // Revert optimistic update on error
        setOptimisticVote(userVote);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={isPending}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
          'hover:bg-primary/10 hover:text-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          optimisticVote === 'up'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
        aria-label="Vota positivo"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Score */}
      <div
        className={cn(
          'text-lg font-bold',
          score > 0 ? 'text-green-600 dark:text-green-400' : score < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
        )}
      >
        {score > 0 && '+'}
        {score}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={isPending}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
          'hover:bg-destructive/10 hover:text-destructive',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          optimisticVote === 'down'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-muted text-muted-foreground'
        )}
        aria-label="Vota negativo"
      >
        <ArrowDown className="h-5 w-5" />
      </button>
    </div>
  );
}
