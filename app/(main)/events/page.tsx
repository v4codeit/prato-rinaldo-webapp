import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { getAllEvents } from '@/app/actions/events';
import { getCurrentUser } from '@/app/actions/users';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { HorizontalCalendar } from '@/components/events/horizontal-calendar';
import { EventCard } from '@/components/events/event-card';

export const metadata = {
  title: 'Eventi',
  description: 'Scopri e partecipa agli eventi della community',
};

export default async function EventsPage() {
  const { user } = await getCurrentUser();
  const { events } = await getAllEvents();
  const canCreateEvent = user?.committee_role !== null;

  return (
    <div className="container py-8 pb-24">
      {/* Modern Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Eventi
            </h1>
            <p className="text-muted-foreground mt-1">
              Scopri e partecipa agli eventi della community di Prato Rinaldo
            </p>
          </div>
          {canCreateEvent && (
            <Button className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 hidden md:flex" asChild>
              <Link href="/events/new">
                <Calendar className="h-4 w-4 mr-2" />
                Nuovo Evento
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Calendar Strip */}
      <HorizontalCalendar />

      {/* Events Grid */}
      {events?.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nessun evento disponibile"
          description="Al momento non ci sono eventi programmati. Torna più tardi!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event: any) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Floating Action Button for Creation (Mobile First) */}
      {canCreateEvent && (
        <div className="fixed bottom-24 right-6 z-40">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-teal-600 hover:bg-teal-700" asChild>
            <Link href="/events/new">
              <Calendar className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
