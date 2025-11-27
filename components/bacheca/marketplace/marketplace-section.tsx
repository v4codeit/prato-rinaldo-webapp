'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarketplaceItemCard } from './marketplace-item-card';
import { MarketplaceFiltersComponent } from './marketplace-filters';
import { Plus, ShoppingBag, Package, AlertCircle } from 'lucide-react';
import type { MarketplaceItemWithActions, MarketplaceFilters, SortOption } from '@/types/bacheca';
import type { Category } from '@/app/actions/categories';
import { deleteMarketplaceItem, markItemAsSold } from '@/app/actions/marketplace';
import { toast } from 'sonner';

interface MarketplaceSectionProps {
  marketplaceItems: MarketplaceItemWithActions[];
  categories: Category[];
  onRefresh?: () => void;
}

export function MarketplaceSection({
  marketplaceItems,
  categories,
  onRefresh,
}: MarketplaceSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<MarketplaceFilters>({ status: 'all' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter items based on current filters and search
  const filteredItems = useMemo(() => {
    let result = [...marketplaceItems];

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          (item.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      result = result.filter((item) => item.status === filters.status);
    }

    // Apply is_sold filter
    if (filters.is_sold !== undefined) {
      result = result.filter((item) => item.is_sold === filters.is_sold);
    }

    // Apply category filter
    if (filters.category) {
      result = result.filter((item) => item.category?.id === filters.category);
    }

    // Apply condition filter
    if (filters.condition) {
      result = result.filter((item) => item.condition === filters.condition);
    }

    // Apply price range filter
    if (filters.price_min !== undefined) {
      result = result.filter((item) => item.price >= filters.price_min!);
    }
    if (filters.price_max !== undefined) {
      result = result.filter((item) => item.price <= filters.price_max!);
    }

    // Apply date range filter
    if (filters.date_from) {
      result = result.filter(
        (item) => new Date(item.created_at) >= new Date(filters.date_from!)
      );
    }
    if (filters.date_to) {
      result = result.filter(
        (item) => new Date(item.created_at) <= new Date(filters.date_to!)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [marketplaceItems, filters, search, sortBy]);

  const handleEdit = (itemId: string) => {
    router.push(`/marketplace/${itemId}/edit` as Route);
  };

  const handleDelete = async (itemId: string) => {
    startTransition(async () => {
      const result = await deleteMarketplaceItem(itemId);

      if (result.error) {
        toast.error('Errore', {
          description: result.error,
        });
      } else {
        toast.success('Annuncio eliminato', {
          description: 'L\'annuncio è stato eliminato con successo',
        });
        onRefresh?.();
        router.refresh();
      }
    });
  };

  const handleMarkSold = async (itemId: string) => {
    startTransition(async () => {
      const result = await markItemAsSold(itemId);

      if (result.error) {
        toast.error('Errore', {
          description: result.error,
        });
      } else {
        toast.success('Annuncio aggiornato', {
          description: 'L\'annuncio è stato segnato come venduto',
        });
        onRefresh?.();
        router.refresh();
      }
    });
  };

  const handleCreateNew = () => {
    router.push('/marketplace/new');
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: marketplaceItems.length,
      active: marketplaceItems.filter((i) => i.status === 'approved' && !i.is_sold)
        .length,
      sold: marketplaceItems.filter((i) => i.is_sold).length,
      pending: marketplaceItems.filter((i) => i.status === 'pending').length,
    };
  }, [marketplaceItems]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                I Miei Annunci Marketplace
              </CardTitle>
              <CardDescription className="mt-1">
                Gestisci i tuoi annunci e monitora le vendite
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Annuncio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Totali</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Attivi</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
              <div className="text-sm text-muted-foreground">Venduti</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">In attesa</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sort */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar (Desktop) / Sheet (Mobile) */}
        <div className="lg:col-span-1">
          <MarketplaceFiltersComponent
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Items List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sort Control */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? 'annuncio' : 'annunci'}
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Più recenti</SelectItem>
                <SelectItem value="oldest">Meno recenti</SelectItem>
                <SelectItem value="price_asc">Prezzo (basso)</SelectItem>
                <SelectItem value="price_desc">Prezzo (alto)</SelectItem>
                <SelectItem value="title">Titolo (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <MarketplaceItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  onMarkSold={() => handleMarkSold(item.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                {marketplaceItems.length === 0 ? (
                  <>
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nessun annuncio ancora
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Inizia a vendere i tuoi prodotti nella community
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crea il tuo primo annuncio
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nessun risultato
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Prova a modificare i filtri di ricerca
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({ status: 'all' });
                        setSearch('');
                      }}
                    >
                      Cancella filtri
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading Overlay */}
          {isPending && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm">Aggiornamento in corso...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
