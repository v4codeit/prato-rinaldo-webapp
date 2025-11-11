'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search } from 'lucide-react';
import { ProposalsFilters } from '@/types/bacheca';
import { ProposalCategory } from '@/app/actions/proposals';

interface ProposalsFiltersProps {
  filters: ProposalsFilters;
  onFilterChange: (filters: ProposalsFilters) => void;
  categories: ProposalCategory[];
  totalCount: number;
}

/**
 * Status tabs configuration
 */
const STATUS_TABS = [
  { value: 'all', label: 'Tutte', color: 'text-foreground' },
  { value: 'proposed', label: 'Proposte', color: 'text-blue-600' },
  { value: 'under_review', label: 'In Revisione', color: 'text-yellow-600' },
  { value: 'approved', label: 'Approvate', color: 'text-green-600' },
  { value: 'declined', label: 'Rifiutate', color: 'text-red-600' },
] as const;

export function ProposalsFiltersPanel({
  filters,
  onFilterChange,
  categories,
  totalCount,
}: ProposalsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProposalsFilters>(filters);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleStatusChange = (status: string) => {
    const newFilters = {
      ...localFilters,
      status: status === 'all' ? undefined : (status as any),
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = {
      ...localFilters,
      category: categoryId === 'all' ? undefined : categoryId,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (search: string) => {
    const newFilters = {
      ...localFilters,
      search: search || undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateFromChange = (date: string) => {
    const newFilters = {
      ...localFilters,
      date_from: date || undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateToChange = (date: string) => {
    const newFilters = {
      ...localFilters,
      date_to: date || undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ProposalsFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsSheetOpen(false);
  };

  const hasActiveFilters = Boolean(
    localFilters.category ||
    localFilters.status ||
    localFilters.search ||
    localFilters.date_from ||
    localFilters.date_to
  );

  const activeFilterCount = [
    localFilters.category,
    localFilters.status,
    localFilters.search,
    localFilters.date_from,
    localFilters.date_to,
  ].filter(Boolean).length;

  // Advanced Filters Content (used in both mobile sheet and desktop)
  const AdvancedFiltersContent = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="category-filter">
          Categoria
        </label>
        <Select
          value={localFilters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="category-filter" aria-label="Seleziona categoria">
            <SelectValue placeholder="Tutte le categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Periodo</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="date-from" className="text-xs text-muted-foreground">
              Da
            </label>
            <Input
              id="date-from"
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              aria-label="Data inizio"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="text-xs text-muted-foreground">
              A
            </label>
            <Input
              id="date-to"
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              aria-label="Data fine"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
          aria-label="Cancella tutti i filtri"
        >
          <X className="h-4 w-4 mr-2" />
          Cancella filtri
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar - Always visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca nelle proposte..."
          value={localFilters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Cerca proposte"
        />
      </div>

      {/* Status Tabs - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 min-w-max md:min-w-0">
          {STATUS_TABS.map((tab) => {
            const isActive = localFilters.status === tab.value || (!localFilters.status && tab.value === 'all');
            return (
              <Button
                key={tab.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(tab.value)}
                className="whitespace-nowrap"
                aria-pressed={isActive}
                aria-label={`Filtra per stato: ${tab.label}`}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters - Mobile: Sheet, Desktop: Inline */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'proposta' : 'proposte'}
        </p>

        {/* Mobile: Filter Sheet */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtri
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtri avanzati</SheetTitle>
                <SheetDescription>
                  Raffina la ricerca delle tue proposte
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <AdvancedFiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: Inline Filters Toggle */}
        <div className="hidden md:block">
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro attivo' : 'filtri attivi'}
            </Badge>
          )}
        </div>
      </div>

      {/* Desktop: Advanced Filters (always visible) */}
      <div className="hidden md:block border-t pt-4">
        <AdvancedFiltersContent />
      </div>
    </div>
  );
}
