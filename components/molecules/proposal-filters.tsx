'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROPOSAL_STATUS } from '@/lib/utils/constants';

interface ProposalFiltersProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export function ProposalFilters({ categories }: ProposalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || 'all';
  const currentStatus = searchParams.get('status') || 'all';
  const currentSort = searchParams.get('sort') || 'score';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Reset to page 1 when filtering
    params.delete('page');

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Category Filter */}
      <Select value={currentCategory} onValueChange={(value) => updateFilter('category', value)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutte le categorie</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={currentStatus} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Stato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti gli stati</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.PROPOSED}>Proposte</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.UNDER_REVIEW}>In Valutazione</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.APPROVED}>Approvate</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.IN_PROGRESS}>In Corso</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.COMPLETED}>Completate</SelectItem>
          <SelectItem value={PROPOSAL_STATUS.DECLINED}>Respinte</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Filter */}
      <Select value={currentSort} onValueChange={(value) => updateFilter('sort', value)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Ordina per" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="score">Più votate</SelectItem>
          <SelectItem value="created_at">Più recenti</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
