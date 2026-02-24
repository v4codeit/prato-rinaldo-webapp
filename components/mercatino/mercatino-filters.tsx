'use client';

import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface MercatinoCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface MercatinoFiltersProps {
  categories: MercatinoCategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  listingTypeFilter: 'all' | 'objects' | 'real_estate';
  onListingTypeChange: (type: 'all' | 'objects' | 'real_estate') => void;
}

export function MercatinoFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  listingTypeFilter,
  onListingTypeChange,
}: MercatinoFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Cerca annunci..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-2xl border-slate-200 bg-white"
        >
          <Filter className="h-5 w-5 text-slate-600" />
        </Button>
      </div>

      {/* Listing Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 demo-no-scrollbar">
        <Badge
          className={cn(
            'rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-colors',
            listingTypeFilter === 'all'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-white border hover:bg-slate-50 text-slate-700'
          )}
          onClick={() => onListingTypeChange('all')}
        >
          Tutti
        </Badge>
        <Badge
          className={cn(
            'rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-colors',
            listingTypeFilter === 'objects'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white border hover:bg-slate-50 text-slate-700'
          )}
          onClick={() => onListingTypeChange('objects')}
        >
          Oggetti
        </Badge>
        <Badge
          className={cn(
            'rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-colors',
            listingTypeFilter === 'real_estate'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white border hover:bg-slate-50 text-slate-700'
          )}
          onClick={() => onListingTypeChange('real_estate')}
        >
          Immobili
        </Badge>
      </div>

      {/* Category Filter (only for objects) */}
      {listingTypeFilter !== 'real_estate' && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 demo-no-scrollbar">
          <Badge
            className={cn(
              'rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-colors',
              selectedCategory === null
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-white border hover:bg-slate-50 text-slate-700'
            )}
            onClick={() => onCategoryChange(null)}
          >
            Tutte le categorie
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              className={cn(
                'rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-colors',
                selectedCategory === category.id
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white border hover:bg-slate-50 text-slate-700'
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
