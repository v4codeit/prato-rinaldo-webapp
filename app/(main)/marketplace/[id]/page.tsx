import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageGallery } from '@/components/molecules/image-gallery';
import { getItemById } from '@/app/actions/marketplace';
import { Euro, MapPin, Package, User, Pencil } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getShortName, getInitials } from '@/lib/utils/format';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item } = await getItemById(id);

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

export default async function MarketplaceItemPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || '/marketplace';
  const { item } = await getItemById(id);

  if (!item) {
    notFound();
  }

  const marketplaceItem = item as any;

  // Check if current user is the seller
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && marketplaceItem.seller_id === user.id;

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <ImageGallery
              images={marketplaceItem.images || []}
              alt={marketplaceItem.title}
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold">{marketplaceItem.title}</h1>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <Link href={`/marketplace/${marketplaceItem.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifica
                      </Button>
                    </Link>
                  )}
                  <Badge variant="secondary">{marketplaceItem.condition}</Badge>
                </div>
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
                  <span className="font-medium">{marketplaceItem.category?.name}</span>
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
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={marketplaceItem.seller?.avatar || undefined}
                      alt={marketplaceItem.seller?.name}
                    />
                    <AvatarFallback>
                      {getInitials(marketplaceItem.seller?.name || 'Seller')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{getShortName(marketplaceItem.seller?.name || '')}</p>
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
                <Link href={returnTo as any}>
                  {returnTo.includes('feed') || returnTo.includes('bacheca')
                    ? 'Torna al Feed'
                    : 'Torna al Marketplace'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
