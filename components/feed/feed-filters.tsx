'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Calendar, ShoppingBag, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Feed Filters Component
 *
 * Usage:
 * ```tsx
 * // Desktop sidebar
 * <FeedFilters activeFilter="all" sortBy="newest" variant="default" />
 *
 * // Mobile inline
 * <FeedFilters activeFilter="all" sortBy="newest" variant="compact" />
 * ```
 *
 * Accessibility:
 * - ARIA labels on all interactive elements
 * - Keyboard navigation support
 * - Visual focus indicators
 * - Screen reader announcements for filter changes
 */

export type FeedFilterType = 'all' | 'event' | 'marketplace' | 'proposal';
export type FeedSortType = 'newest' | 'popular';

interface FeedFiltersProps {
  activeFilter?: FeedFilterType;
  sortBy?: FeedSortType;
  variant?: 'default' | 'compact';
  className?: string;
}

const FILTER_CONFIG = [
  { type: 'all' as const, label: 'Tutti', icon: Layers },
  { type: 'event' as const, label: 'Eventi', icon: Calendar },
  { type: 'marketplace' as const, label: 'Marketplace', icon: ShoppingBag },
  { type: 'proposal' as const, label: 'Proposte', icon: Lightbulb },
];

const SORT_OPTIONS = [
  { value: 'newest' as const, label: 'Più recenti' },
  { value: 'popular' as const, label: 'Più popolari' },
];

export function FeedFilters({
  activeFilter = 'all',
  sortBy = 'newest',
  variant = 'default',
  className,
}: FeedFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Updates URL with new filter/sort parameters while preserving other params
   */
  const updateURLParams = (type?: FeedFilterType, sort?: FeedSortType) => {
    const params = new URLSearchParams(searchParams?.toString());

    // Update or remove type param
    if (type && type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }

    // Update or remove sort param
    if (sort && sort !== 'newest') {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }

    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;

    // Type assertion needed for dynamic query string building
    router.push(newPath as any);
  };

  const handleFilterChange = (type: FeedFilterType) => {
    updateURLParams(type, sortBy);
  };

  const handleSortChange = (sort: FeedSortType) => {
    updateURLParams(activeFilter, sort);
  };

  // Compact variant for mobile
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-3 items-center', className)}>
        {/* Type Filter Select */}
        <div className="flex-1 min-w-0">
          <Select
            value={activeFilter}
            onValueChange={(value) => handleFilterChange(value as FeedFilterType)}
            aria-label="Filtra contenuti per tipo"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CONFIG.map(({ type, label, icon: Icon }) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Select */}
        <div className="flex-1 min-w-0">
          <Select
            value={sortBy}
            onValueChange={(value) => handleSortChange(value as FeedSortType)}
            aria-label="Ordina contenuti"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordina" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Default variant for desktop sidebar
  return (
    <Card className={cn('p-4', className)}>
      {/* Type Filters */}
      <div role="group" aria-labelledby="filter-type-heading">
        <h3 id="filter-type-heading" className="font-semibold mb-3 text-sm">
          Filtra per tipo
        </h3>
        <div className="space-y-2">
          {FILTER_CONFIG.map(({ type, label, icon: Icon }) => {
            const isActive = activeFilter === type;
            return (
              <Button
                key={type}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => handleFilterChange(type)}
                aria-pressed={isActive}
                aria-label={`Filtra per ${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Sort Options */}
      <div role="group" aria-labelledby="sort-heading">
        <h3 id="sort-heading" className="font-semibold mb-3 text-sm">
          Ordina
        </h3>
        <Select
          value={sortBy}
          onValueChange={(value) => handleSortChange(value as FeedSortType)}
          aria-label="Ordina contenuti"
        >
          <SelectTrigger className="w-full" aria-label="Seleziona ordinamento">
            <SelectValue placeholder="Seleziona ordinamento" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

/**
 * Hook to extract feed filters from URL search params
 *
 * Usage in page:
 * ```tsx
 * const { type, sort } = useFeedFilters();
 * return <FeedFilters activeFilter={type} sortBy={sort} />;
 * ```
 */
export function useFeedFilters() {
  const searchParams = useSearchParams();

  const type = (searchParams?.get('type') as FeedFilterType) || 'all';
  const sort = (searchParams?.get('sort') as FeedSortType) || 'newest';

  return { type, sort };
}
