import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/molecules/empty-state';
import { getApprovedItems } from '@/app/actions/marketplace';
import { ShoppingBag, Euro } from 'lucide-react';
import Link from 'next/link';
import { getShortName, getInitials } from '@/lib/utils/format';

export const metadata = {
  title: 'Marketplace',
  description: 'Compra e vendi nella community',
};

export default async function MarketplacePage() {
  const { items } = await getApprovedItems();

  return (
    <div className="container py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {item.images && item.images.length > 0 && (
                    <div className="aspect-square w-full overflow-hidden rounded-t-xl">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                      <Badge variant="secondary">{item.condition}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Euro className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{item.price}</span>
                      </div>
                      {item.committee_percentage > 0 && (
                        <Badge variant="outline">
                          {item.committee_percentage}% al comitato
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={item.seller?.avatar || undefined}
                          alt={item.seller?.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(item.seller?.name || 'S')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {getShortName(item.seller?.name || '')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/marketplace/new">Pubblica Annuncio</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
