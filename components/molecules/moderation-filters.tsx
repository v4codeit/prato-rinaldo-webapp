'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

type ModerationStatus = 'pending' | 'approved' | 'rejected';

interface ModerationFiltersProps {
  currentFilter: ModerationStatus;
}

export function ModerationFilters({ currentFilter }: ModerationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (status: ModerationStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={currentFilter === 'pending' ? 'default' : 'outline'}
        onClick={() => setFilter('pending')}
      >
        In Attesa
      </Button>
      <Button
        variant={currentFilter === 'approved' ? 'default' : 'outline'}
        onClick={() => setFilter('approved')}
      >
        Approvati
      </Button>
      <Button
        variant={currentFilter === 'rejected' ? 'default' : 'outline'}
        onClick={() => setFilter('rejected')}
      >
        Rifiutati
      </Button>
    </div>
  );
}
