'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { voteProposal } from '@/app/actions/proposals';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ProposalVoteButtonsProps {
  proposalId: string;
  userVote: 'up' | 'down' | null;
}

export function ProposalVoteButtons({ proposalId, userVote }: ProposalVoteButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticVote, setOptimisticVote] = useState<'up' | 'down' | null>(userVote);

  const handleVote = (voteType: 'up' | 'down') => {
    // Optimistic update
    const newVote = optimisticVote === voteType ? null : voteType;
    setOptimisticVote(newVote);

    startTransition(async () => {
      const result = await voteProposal(proposalId, voteType);

      if (result.error) {
        toast.error(result.error);
        // Revert optimistic update
        setOptimisticVote(userVote);
      } else {
        toast.success(
          newVote === null
            ? 'Voto rimosso'
            : voteType === 'up'
              ? 'Hai votato a favore!'
              : 'Hai espresso perplessità'
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant={optimisticVote === 'up' ? 'default' : 'outline'}
        size="lg"
        onClick={() => handleVote('up')}
        disabled={isPending}
        className="flex-1 sm:flex-none"
      >
        {isPending && optimisticVote !== 'down' ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <ThumbsUp className="h-5 w-5 mr-2" />
        )}
        {optimisticVote === 'up' ? 'Votato a Favore' : 'Vota a Favore'}
      </Button>

      <Button
        variant={optimisticVote === 'down' ? 'destructive' : 'outline'}
        size="lg"
        onClick={() => handleVote('down')}
        disabled={isPending}
        className="flex-1 sm:flex-none"
      >
        {isPending && optimisticVote !== 'up' ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <ThumbsDown className="h-5 w-5 mr-2" />
        )}
        {optimisticVote === 'down' ? 'Hai Perplessità' : 'Ho Perplessità'}
      </Button>
    </div>
  );
}
