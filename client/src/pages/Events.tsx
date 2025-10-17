import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Users, Euro } from "lucide-react";
import { toast } from "sonner";

export default function Events() {
  const { user, isAuthenticated } = useAuth();
  const { data: publicEvents } = trpc.events.listPublic.useQuery({ tenantId: "prato-rinaldo-default" });
  const { data: privateEvents } = trpc.events.listPrivate.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const rsvpMutation = trpc.events.rsvp.useMutation();

  const handleRsvp = async (eventId: string, status: "going" | "maybe" | "not_going") => {
    try {
      await rsvpMutation.mutateAsync({ eventId, status });
      toast.success("RSVP aggiornato con successo!");
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del RSVP");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const EventCard = ({ event, isPrivate = false }: { event: any; isPrivate?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {event.coverImage && (
        <img
          src={event.coverImage}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1">{event.title}</CardTitle>
          {isPrivate && (
            <Badge variant="secondary">Privato</Badge>
          )}
        </div>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.maxAttendees && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Max {event.maxAttendees} partecipanti</span>
            </div>
          )}
          {event.requiresPayment && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              <span>€{(event.price / 100).toFixed(2)}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      {event.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
        </CardContent>
      )}
      {isAuthenticated && user?.verificationStatus === 'approved' && (
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleRsvp(event.id, "going")}
              disabled={rsvpMutation.isPending}
            >
              Partecipo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRsvp(event.id, "maybe")}
              disabled={rsvpMutation.isPending}
            >
              Forse
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRsvp(event.id, "not_going")}
              disabled={rsvpMutation.isPending}
            >
              Non partecipo
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="container py-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Eventi</h1>
        <p className="text-lg text-muted-foreground">
          Scopri e partecipa agli eventi della comunità di Prato Rinaldo
        </p>
      </div>

      {/* Public Events */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Eventi Pubblici</h2>
        {publicEvents && publicEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nessun evento pubblico al momento</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Private Events (only for verified users) */}
      {isAuthenticated && user?.verificationStatus === 'approved' && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Eventi Privati</h2>
          {privateEvents && privateEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateEvents.map((event) => (
                <EventCard key={event.id} event={event} isPrivate />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nessun evento privato al momento</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

