import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { getAllEvents } from '@/app/actions/events';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const metadata = {
  title: 'Eventi',
  description: 'Scopri e partecipa agli eventi della community',
};

export default async function EventsPage() {
  const { events } = await getAllEvents();

  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Eventi</h1>
        <p className="text-lg text-muted-foreground">
          Scopri e partecipa agli eventi organizzati dalla community
        </p>
      </div>

      {events?.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nessun evento disponibile"
          description="Al momento non ci sono eventi programmati. Torna più tardi!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                {event.cover_image && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                    <img
                      src={event.cover_image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    {event.is_private && (
                      <Badge variant="secondary">Privato</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(event.start_date), 'PPP', { locale: it })}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  {event.max_attendees && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Max {event.max_attendees} partecipanti</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Button size="lg" asChild>
          <Link href="/events/new">Crea Nuovo Evento</Link>
        </Button>
      </div>
    </div>
  );
}
