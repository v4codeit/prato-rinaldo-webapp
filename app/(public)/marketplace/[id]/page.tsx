import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getItemById } from '@/app/actions/marketplace';
import { Euro, MapPin, Package, User } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { item } = await getItemById(params.id);

  if (!item) {
    return {
      title: 'Annuncio non trovato',
    };
  }

  return {
    title: (item as any).title || 'Annuncio',
    description: (item as any).description || '',
  };
}

export default async function MarketplaceItemPage({ params }: { params: { id: string } }) {
  const { item } = await getItemById(params.id);

  if (!item) {
    notFound();
  }

  const marketplaceItem = item as any;

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {marketplaceItem.images && marketplaceItem.images.length > 0 ? (
              <div className="aspect-square w-full overflow-hidden rounded-xl border">
                <img
                  src={marketplaceItem.images[0]}
                  alt={marketplaceItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square w-full flex items-center justify-center bg-muted rounded-xl border">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {marketplaceItem.images && marketplaceItem.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {marketplaceItem.images.slice(1, 5).map((image: string, index: number) => (
                  <div
                    key={index}
                    className="aspect-square w-full overflow-hidden rounded-lg border"
                  >
                    <img
                      src={image}
                      alt={`${marketplaceItem.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold">{marketplaceItem.title}</h1>
                <Badge variant="secondary">{marketplaceItem.condition}</Badge>
              </div>
              <div className="flex items-center gap-1 mb-4">
                <Euro className="h-8 w-8 text-primary" />
                <span className="text-4xl font-bold">{marketplaceItem.price}</span>
              </div>
              {marketplaceItem.committee_percentage > 0 && (
                <Badge variant="outline" className="mb-4">
                  {marketplaceItem.committee_percentage}% va al comitato
                </Badge>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{marketplaceItem.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dettagli</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium">{marketplaceItem.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Condizione:</span>
                  <span className="font-medium">{marketplaceItem.condition}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Venditore</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <img
                    src={marketplaceItem.seller?.avatar || '/default-avatar.png'}
                    alt={marketplaceItem.seller?.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{marketplaceItem.seller?.name}</p>
                    {marketplaceItem.seller?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {marketplaceItem.seller.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button className="w-full" size="lg">
                Contatta Venditore
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/marketplace">Torna al Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
