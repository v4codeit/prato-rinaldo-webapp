import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEventById, getUserRsvp } from '@/app/actions/events';
import { createClient } from '@/lib/supabase/server';
import { canDeleteEvent } from '@/lib/utils/auth-helpers';
import { Calendar, MapPin, Users, Euro, Lock, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ROUTES } from '@/lib/utils/constants';
import { getShortName } from '@/lib/utils/format';
import { RsvpSection } from './rsvp-section';
import { DeleteEventButton } from './delete-event-button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await getEventById(id);

  if (!event) {
    return {
      title: 'Evento non trovato',
    };
  }

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.cover_image ? [event.cover_image] : [],
    },
  };
}

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || ROUTES.EVENTS;
  const { event } = await getEventById(id);

  if (!event) {
    notFound();
  }

  // Get current user for permission checks
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user can edit/delete
  let canEdit = false;
  let canDelete = false;
  if (user) {
    // Board members can edit
    const { data: profile } = await supabase
      .from('users')
      .select('committee_role')
      .eq('id', user.id)
      .single() as { data: { committee_role: string | null } | null };

    canEdit = profile?.committee_role !== null;
    canDelete = await canDeleteEvent(user.id, event.organizer_id || '');
  }

  // Get user's RSVP if logged in
  const { rsvp } = user ? await getUserRsvp(id) : { rsvp: null };

  // Format dates
  const startDate = new Date(event.start_date || new Date());
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isSameDay = endDate && format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  return (
    <div className="container py-6 md:py-12">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="hover:bg-accent">
          <Link href={returnTo as any}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {returnTo.includes('feed') || returnTo.includes('bacheca')
                ? 'Torna al Feed'
                : 'Torna agli Eventi'}
            </span>
            <span className="sm:hidden">Indietro</span>
          </Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {event.cover_image ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg lg:rounded-xl border bg-muted shadow-sm">
                <Image
                  src={event.cover_image || ''}
                  alt={event.title || 'Event cover'}
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                />
              </div>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg lg:rounded-xl border">
                <div className="text-center">
                  <Calendar className="h-16 w-16 md:h-24 md:w-24 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nessuna immagine disponibile</p>
                </div>
              </div>
            )}

            {/* Title and Badges */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{event.title}</h1>
                <div className="flex gap-2 flex-wrap sm:flex-shrink-0">
                  {event.is_private && (
                    <Badge variant="secondary" className="gap-1.5 h-6">
                      <Lock className="h-3 w-3" />
                      Solo Residenti
                    </Badge>
                  )}
                  {(event as any).category && (
                    <Badge variant="outline" className="h-6">
                      {(event as any).category.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons for Board Members */}
              {(canEdit || canDelete) && (
                <div className="flex gap-2 mb-4 pb-4 border-b">
                  {canEdit && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${id}/edit` as Route}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica
                      </Link>
                    </Button>
                  )}
                  {canDelete && (
                    <DeleteEventButton eventId={id} />
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Organizer */}
            {event.organizer && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Organizzatore</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {event.organizer.avatar ? (
                      <Image
                        src={event.organizer.avatar}
                        alt={event.organizer.name}
                        width={56}
                        height={56}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{getShortName(event.organizer.name)}</p>
                      {event.organizer.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {event.organizer.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Event Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Dettagli Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Data e Ora
                    </p>
                    <p className="font-semibold text-foreground">
                      {format(startDate, 'PPP', { locale: it })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(startDate, 'HH:mm', { locale: it })}
                      {endDate && !isSameDay && (
                        <>
                          {' - '}
                          {format(endDate, 'PPP HH:mm', { locale: it })}
                        </>
                      )}
                      {endDate && isSameDay && (
                        <>
                          {' - '}
                          {format(endDate, 'HH:mm', { locale: it })}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Luogo
                      </p>
                      <p className="font-semibold text-foreground break-words">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Max Attendees */}
                {event.max_attendees && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Partecipanti
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {event.rsvp_count || 0} / {event.max_attendees}
                        </p>
                        {event.rsvp_count >= event.max_attendees && (
                          <Badge variant="destructive" className="text-xs">Completo</Badge>
                        )}
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(
                              ((event.rsvp_count || 0) / event.max_attendees) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Price */}
                {event.requires_payment && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Euro className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Prezzo
                      </p>
                      <p className="font-bold text-xl text-foreground">
                        {(event.price ?? 0) > 0 ? `€${(event.price ?? 0).toFixed(2)}` : 'Gratuito'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RSVP Section */}
            <RsvpSection
              eventId={id}
              currentRsvp={rsvp?.status || null}
              isLoggedIn={!!user}
              isFull={event.max_attendees ? event.rsvp_count >= event.max_attendees : false}
            />

            {/* Back Button - Desktop Only */}
            <Button className="w-full hidden lg:flex" variant="outline" asChild>
              <Link href={returnTo as any}>
                {returnTo.includes('feed') || returnTo.includes('bacheca')
                  ? 'Torna al Feed'
                  : 'Tutti gli Eventi'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
