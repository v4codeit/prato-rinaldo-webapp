'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Plus, ShoppingBag, Home, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/molecules/empty-state';
import { MercatinoCard } from './mercatino-card';
import { MercatinoFilters, type MercatinoCategory } from './mercatino-filters';
import { ROUTES } from '@/lib/utils/constants';

export interface MercatinoListItem {
  id: string;
  title: string;
  price: number;
  images?: string[];
  condition?: string;
  is_sold?: boolean;
  listing_type?: 'real_estate' | 'objects';
  real_estate_type?: 'rent' | 'sale' | null;
  object_type?: 'sale' | 'gift' | null;
  square_meters?: number;
  rooms?: number;
  address_zone?: string;
  has_donated?: boolean;
  view_count?: number;
  category_id?: string | null;
  category_name?: string | null;
  seller?: {
    id?: string;
    name?: string;
    avatar?: string | null;
  };
}

interface MercatinoListClientProps {
  items: MercatinoListItem[];
  categories: MercatinoCategory[];
}

export function MercatinoListClient({ items, categories }: MercatinoListClientProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [listingTypeFilter, setListingTypeFilter] = React.useState<'all' | 'objects' | 'real_estate'>('all');

  // Filter items based on search, category, and listing type
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(query) ||
          item.category_name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Listing type filter
      if (listingTypeFilter !== 'all') {
        const itemType = item.listing_type || 'objects';
        if (itemType !== listingTypeFilter) return false;
      }

      // Category filter (only for objects)
      if (selectedCategory && item.listing_type !== 'real_estate') {
        if (item.category_id !== selectedCategory) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, listingTypeFilter]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const objectItems = filteredItems.filter(
      (item) => !item.listing_type || item.listing_type === 'objects'
    );
    const realEstateItems = filteredItems.filter(
      (item) => item.listing_type === 'real_estate'
    );
    const giftItems = filteredItems.filter(
      (item) => item.object_type === 'gift'
    );

    return {
      objects: objectItems.length,
      realEstate: realEstateItems.length,
      gifts: giftItems.length,
      total: filteredItems.length,
    };
  }, [filteredItems]);

  return (
    <div className="container py-8 pb-24">
      {/* Modern Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Mercatino
            </h1>
            <p className="text-slate-500 mt-1">
              Compra, vendi, affitta e regala con i tuoi vicini
            </p>
          </div>
          <Button
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hidden md:flex"
            asChild
          >
            <Link href={`${ROUTES.MERCATINO}/new` as Route}>
              <Plus className="h-4 w-4 mr-2" />
              Vendi
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <MercatinoFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          listingTypeFilter={listingTypeFilter}
          onListingTypeChange={setListingTypeFilter}
        />
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          <ShoppingBag className="h-3 w-3 mr-1" />
          {stats.objects} oggetti
        </Badge>
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          <Home className="h-3 w-3 mr-1" />
          {stats.realEstate} immobili
        </Badge>
        {stats.gifts > 0 && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-amber-600 border-amber-300">
            <Gift className="h-3 w-3 mr-1" />
            {stats.gifts} regali
          </Badge>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={searchQuery || selectedCategory ? 'Nessun risultato' : 'Nessun annuncio disponibile'}
          description={
            searchQuery || selectedCategory
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Al momento non ci sono annunci pubblicati. Sii il primo!'
          }
          action={
            searchQuery || selectedCategory ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setListingTypeFilter('all');
                }}
              >
                Rimuovi filtri
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Link href={`${ROUTES.MERCATINO}/new` as Route}>
                  <Plus className="h-4 w-4 mr-2" />
                  Pubblica Annuncio
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <MercatinoCard
                key={item.id}
                item={item}
                showViewCount
              />
            ))}
          </div>

          {/* Floating Action Button (Mobile) */}
          <div className="fixed bottom-24 right-6 z-40 md:hidden">
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-xl bg-emerald-600 hover:bg-emerald-700"
              asChild
            >
              <Link href={`${ROUTES.MERCATINO}/new` as Route}>
                <Plus className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
