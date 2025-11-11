'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '@/app/actions/proposals';
import { toast } from 'sonner';

interface ProposalCommentFormProps {
  proposalId: string;
}

export function ProposalCommentForm({ proposalId }: ProposalCommentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Il commento non può essere vuoto');
      return;
    }

    if (content.length < 10) {
      toast.error('Il commento deve contenere almeno 10 caratteri');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', content);

      const result = await createComment(proposalId, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Commento pubblicato!');
        setContent('');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Scrivi un commento..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
        className="min-h-[100px]"
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {content.length} / 2000 caratteri
        </p>
        <Button type="submit" disabled={isPending || content.length < 10}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Invio...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Commenta
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
