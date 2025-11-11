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
import { Label } from '@/components/ui/label';
import { Filter, X, Search } from 'lucide-react';
import type { MarketplaceFilters } from '@/types/bacheca';
import type { Category } from '@/app/actions/categories';
import { Badge } from '@/components/ui/badge';

interface MarketplaceFiltersProps {
  filters: MarketplaceFilters;
  onFilterChange: (filters: MarketplaceFilters) => void;
  categories: Category[];
  search: string;
  onSearchChange: (search: string) => void;
}

export function MarketplaceFiltersComponent({
  filters,
  onFilterChange,
  categories,
  search,
  onSearchChange,
}: MarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<MarketplaceFilters>(filters);

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== 'all'
  ).length;

  const handleFilterUpdate = (key: keyof MarketplaceFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: MarketplaceFilters = {
      status: 'all',
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    onSearchChange('');
  };

  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      const { status: _, is_sold, ...rest } = localFilters;
      setLocalFilters(rest);
      onFilterChange(rest);
    } else if (status === 'sold') {
      handleFilterUpdate('is_sold', true);
      const { status: _, ...rest } = localFilters;
      setLocalFilters({ ...rest, is_sold: true });
      onFilterChange({ ...rest, is_sold: true });
    } else {
      const { is_sold, ...rest } = localFilters;
      setLocalFilters({ ...rest, status: status as any });
      onFilterChange({ ...rest, status: status as any });
    }
  };

  const getCurrentStatus = () => {
    if (localFilters.is_sold) return 'sold';
    return localFilters.status || 'all';
  };

  // Filter Panel Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Stato</Label>
        <Select value={getCurrentStatus()} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="approved">Attivi</SelectItem>
            <SelectItem value="sold">Venduti</SelectItem>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="rejected">Rifiutati</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={localFilters.category || 'all'}
            onValueChange={(value) =>
              handleFilterUpdate('category', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tutte le categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Condition Filter */}
      <div className="space-y-2">
        <Label>Condizione</Label>
        <Select
          value={localFilters.condition || 'all'}
          onValueChange={(value) =>
            handleFilterUpdate('condition', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tutte le condizioni" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le condizioni</SelectItem>
            <SelectItem value="new">Nuovo</SelectItem>
            <SelectItem value="like_new">Come nuovo</SelectItem>
            <SelectItem value="good">Buono</SelectItem>
            <SelectItem value="fair">Discreto</SelectItem>
            <SelectItem value="poor">Scarso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Fascia di prezzo</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min"
              min="0"
              step="0.01"
              value={localFilters.price_min || ''}
              onChange={(e) =>
                handleFilterUpdate(
                  'price_min',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              min="0"
              step="0.01"
              value={localFilters.price_max || ''}
              onChange={(e) =>
                handleFilterUpdate(
                  'price_max',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Periodo</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) =>
                handleFilterUpdate('date_from', e.target.value || undefined)
              }
              aria-label="Data inizio"
            />
          </div>
          <div>
            <Input
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) =>
                handleFilterUpdate('date_to', e.target.value || undefined)
              }
              aria-label="Data fine"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <Button
          onClick={handleClearFilters}
          variant="outline"
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Cancella filtri ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cerca per titolo o descrizione..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          aria-label="Cerca annunci"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtri
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtri di ricerca</SheetTitle>
              <SheetDescription>
                Filtra i tuoi annunci per trovare quello che cerchi
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
