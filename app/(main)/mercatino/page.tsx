import { Suspense } from 'react';
import { connection } from 'next/server';
import { Skeleton } from '@/components/ui/skeleton';
import { getApprovedMercatinoItems } from '@/app/actions/mercatino';
import { getCategories } from '@/app/actions/categories';
import { MercatinoListClient } from '@/components/mercatino/mercatino-list-client';

export const metadata = {
  title: 'Mercatino',
  description: 'Compra, vendi, affitta e regala nella community di Prato Rinaldo',
};

// Loading skeleton
function MercatinoSkeleton() {
  return (
    <div className="container py-8 pb-24">
      <div className="mb-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>
      {/* Search skeleton */}
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
      {/* Filter chips skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 w-20 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-3xl overflow-hidden bg-white border">
            <Skeleton className="aspect-square" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main content component
async function MercatinoContent() {
  await connection();

  // Fetch items and categories in parallel
  const [{ items }, { categories }] = await Promise.all([
    getApprovedMercatinoItems(),
    getCategories('marketplace_item'),
  ]);

  // Transform categories for client component
  const clientCategories = (categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon || null,
  }));

  return (
    <MercatinoListClient
      items={items}
      categories={clientCategories}
    />
  );
}

export default function MercatinoPage() {
  return (
    <Suspense fallback={<MercatinoSkeleton />}>
      <MercatinoContent />
    </Suspense>
  );
}
