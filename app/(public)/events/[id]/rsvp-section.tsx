'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createRsvp } from '@/app/actions/events';
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';

interface RsvpSectionProps {
  eventId: string;
  currentRsvp: string | null;
  isLoggedIn: boolean;
  isFull: boolean;
}

export function RsvpSection({ eventId, currentRsvp, isLoggedIn, isFull }: RsvpSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRsvp, setSelectedRsvp] = useState<string | null>(currentRsvp);
  const router = useRouter();

  const handleRsvp = (status: 'going' | 'maybe' | 'not_going') => {
    startTransition(async () => {
      const result = await createRsvp(eventId, status);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSelectedRsvp(status);
      toast.success('Risposta salvata con successo!');
      router.refresh();
    });
  };

  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partecipa</CardTitle>
          <CardDescription>
            Effettua l&apos;accesso per rispondere all&apos;evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" asChild>
            <Link href={ROUTES.LOGIN}>Accedi</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partecipa</CardTitle>
        <CardDescription>
          Facci sapere se parteciperai all&apos;evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Going */}
        <Button
          className="w-full justify-start"
          variant={selectedRsvp === 'going' ? 'default' : 'outline'}
          onClick={() => handleRsvp('going')}
          disabled={isPending || (isFull && selectedRsvp !== 'going')}
        >
          {isPending && selectedRsvp !== 'going' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Parteciperò
          {selectedRsvp === 'going' && (
            <Badge variant="secondary" className="ml-auto">
              Confermato
            </Badge>
          )}
          {isFull && selectedRsvp !== 'going' && (
            <Badge variant="destructive" className="ml-auto text-xs">
              Completo
            </Badge>
          )}
        </Button>

        {/* Maybe */}
        <Button
          className="w-full justify-start"
          variant={selectedRsvp === 'maybe' ? 'default' : 'outline'}
          onClick={() => handleRsvp('maybe')}
          disabled={isPending}
        >
          {isPending && selectedRsvp !== 'maybe' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <HelpCircle className="h-4 w-4 mr-2" />
          )}
          Forse
          {selectedRsvp === 'maybe' && (
            <Badge variant="secondary" className="ml-auto">
              Confermato
            </Badge>
          )}
        </Button>

        {/* Not Going */}
        <Button
          className="w-full justify-start"
          variant={selectedRsvp === 'not_going' ? 'default' : 'outline'}
          onClick={() => handleRsvp('not_going')}
          disabled={isPending}
        >
          {isPending && selectedRsvp !== 'not_going' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          Non parteciperò
          {selectedRsvp === 'not_going' && (
            <Badge variant="secondary" className="ml-auto">
              Confermato
            </Badge>
          )}
        </Button>

        {selectedRsvp && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Puoi cambiare la tua risposta in qualsiasi momento
          </p>
        )}
      </CardContent>
    </Card>
  );
}
