import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPublicEvents } from '@/app/actions/events';
import { getApprovedItems } from '@/app/actions/marketplace';
import { ROUTES } from '@/lib/utils/constants';
import { Calendar, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Bacheca Pubblica',
  description: 'Le ultime novità dalla community di Prato Rinaldo',
};

export default async function FeedPage() {
  // Get public events and marketplace items
  const { events } = await getPublicEvents();
  const { items } = await getApprovedItems();

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bacheca Pubblica</h1>
        <p className="text-lg text-muted-foreground">
          Rimani aggiornato sulle ultime novità della community
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eventi in Programma
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Prossimi appuntamenti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annunci Marketplace
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponibili ora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community Attiva
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-green-600" />
              100%
            </div>
            <p className="text-xs text-muted-foreground">
              Sempre in movimento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventi Column */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Prossimi Eventi
                </CardTitle>
                <CardDescription>Non perdere i prossimi appuntamenti</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.EVENTS}>Vedi tutti</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun evento in programma
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((event: any) => (
                  <Link
                    key={event.id}
                    href={`${ROUTES.EVENTS}/${event.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{event.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(event.start_date).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marketplace Column */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Marketplace
                </CardTitle>
                <CardDescription>Ultimi annunci pubblicati</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.MARKETPLACE}>Vedi tutti</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun annuncio disponibile
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 5).map((item: any) => (
                  <Link
                    key={item.id}
                    href={`${ROUTES.MARKETPLACE}/${item.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          di {item.seller.name}
                        </div>
                      </div>
                      <div className="font-bold text-lg text-primary">
                        {item.price}€
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Entra a far parte della community!</CardTitle>
          <CardDescription>
            Registrati per accedere a tutti i contenuti e partecipare attivamente alla vita del quartiere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link href={ROUTES.REGISTER}>Registrati Gratis</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.LOGIN}>Accedi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
