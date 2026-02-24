'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, Check } from 'lucide-react';
import { voteProposal } from '@/app/actions/proposals';
import { cn } from '@/lib/utils/cn';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ProposalVoteWidgetProps {
  proposalId: string;
  upvotes: number;
  hasVoted?: boolean;
  className?: string;
}

export function ProposalVoteWidget({
  proposalId,
  upvotes,
  hasVoted = false,
  className,
}: ProposalVoteWidgetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticHasVoted, setOptimisticHasVoted] = useState(hasVoted);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(upvotes);

  const handleVote = async () => {
    // Optimistic update
    const newVoteState = !optimisticHasVoted;
    setOptimisticHasVoted(newVoteState);
    setOptimisticUpvotes((current) => newVoteState ? current + 1 : current - 1);

    startTransition(async () => {
      const result = await voteProposal(proposalId);

      if (result.error) {
        // Revert optimistic update on error
        setOptimisticHasVoted(hasVoted);
        setOptimisticUpvotes(upvotes);
        toast.error(result.error);
      } else {
        toast.success(newVoteState ? 'Supporto aggiunto!' : 'Supporto rimosso');
        router.refresh();
      }
    });
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Vote Button */}
      <button
        onClick={handleVote}
        disabled={isPending}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          optimisticHasVoted
            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
            : 'bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-600'
        )}
        aria-label={optimisticHasVoted ? 'Rimuovi supporto' : 'Supporta'}
      >
        {optimisticHasVoted ? (
          <Check className="h-5 w-5" />
        ) : (
          <ThumbsUp className="h-5 w-5" />
        )}
      </button>

      {/* Count */}
      <div
        className={cn(
          'text-lg font-bold',
          optimisticUpvotes > 0 ? 'text-violet-600' : 'text-muted-foreground'
        )}
      >
        {optimisticUpvotes}
      </div>
      <span className="text-[10px] uppercase text-muted-foreground font-medium">
        Supporti
      </span>
    </div>
  );
}
