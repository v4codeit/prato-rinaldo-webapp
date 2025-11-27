import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { getApprovedItems } from '@/app/actions/marketplace';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { MarketplaceCard } from '@/components/marketplace/marketplace-card';

export const metadata = {
  title: 'Marketplace',
  description: 'Compra e vendi nella community',
};

export default async function MarketplacePage() {
  const { items } = await getApprovedItems();

  return (
    <div className="container py-8 pb-24">
      {/* Modern Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Mercatino
            </h1>
            <p className="text-muted-foreground mt-1">
              Compra, vendi e scambia con i tuoi vicini di Prato Rinaldo
            </p>
          </div>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hidden md:flex" asChild>
            <Link href="/marketplace/new">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Pubblica Annuncio
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nessun annuncio disponibile"
          description="Al momento non ci sono annunci pubblicati. Sii il primo a vendere qualcosa!"
          action={
            <Button size="lg" asChild>
              <Link href="/marketplace/new">Pubblica Annuncio</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map((item: any) => (
              <MarketplaceCard key={item.id} item={item} />
            ))}
          </div>

          {/* Floating Action Button (Mobile First) */}
          <div className="fixed bottom-24 right-6 z-40">
            <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/marketplace/new">
                <ShoppingBag className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
