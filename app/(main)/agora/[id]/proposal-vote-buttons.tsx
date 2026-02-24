'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { voteProposal } from '@/app/actions/proposals';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProposalVoteButtonsProps {
  proposalId: string;
  hasVoted: boolean;
}

export function ProposalVoteButtons({ proposalId, hasVoted }: ProposalVoteButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticHasVoted, setOptimisticHasVoted] = useState<boolean>(hasVoted);

  const handleVote = () => {
    // Optimistic update - toggle vote
    const newVoteState = !optimisticHasVoted;
    setOptimisticHasVoted(newVoteState);

    startTransition(async () => {
      const result = await voteProposal(proposalId);

      if (result.error) {
        toast.error(result.error);
        // Revert optimistic update
        setOptimisticHasVoted(hasVoted);
      } else {
        toast.success(
          newVoteState
            ? 'Hai supportato questa proposta!'
            : 'Supporto rimosso'
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-center">
      <Button
        variant={optimisticHasVoted ? 'default' : 'outline'}
        size="lg"
        onClick={handleVote}
        disabled={isPending}
        className={cn(
          'rounded-full px-8 py-6 transition-all duration-200',
          optimisticHasVoted
            ? 'bg-violet-600 hover:bg-violet-700 text-white'
            : 'hover:bg-violet-50 hover:border-violet-300'
        )}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : optimisticHasVoted ? (
          <>
            <ThumbsUp className="h-5 w-5 mr-2 fill-current" />
            <span className="font-semibold">Supportato</span>
            <Check className="h-5 w-5 ml-2" />
          </>
        ) : (
          <>
            <ThumbsUp className="h-5 w-5 mr-2" />
            <span className="font-semibold">Supporta</span>
          </>
        )}
      </Button>
    </div>
  );
}
