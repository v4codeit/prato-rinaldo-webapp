import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface VerificationStatusMessageProps {
  status: 'pending' | 'rejected';
  userEmail?: string | null;
}

export function VerificationStatusMessage({ status, userEmail }: VerificationStatusMessageProps) {
  if (status === 'rejected') {
    return <RejectedMessage userEmail={userEmail} />;
  }
  return <PendingMessage userEmail={userEmail} />;
}

// Alias for backwards compatibility
export const PendingVerificationMessage = ({ userEmail }: { userEmail?: string | null }) => (
  <VerificationStatusMessage status="pending" userEmail={userEmail} />
);

function PendingMessage({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8 px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Account in attesa di attivazione</CardTitle>
          <CardDescription className="text-base mt-2">
            La tua registrazione è stata completata con successo. Un amministratore sta verificando i tuoi dati.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What to expect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Cosa aspettarsi
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">
                  Riceverai una <strong>email di conferma</strong> quando il tuo account sarà attivato
                  {userEmail && (
                    <span className="block text-muted-foreground mt-1">
                      all&apos;indirizzo: <span className="font-mono text-xs">{userEmail}</span>
                    </span>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm">
                  La verifica richiede generalmente <strong>24-48 ore lavorative</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <span className="text-sm">
                  Controlla anche la cartella <strong>spam</strong> se non ricevi comunicazioni
                </span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Hai domande? Contatta il comitato di quartiere per assistenza.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RejectedMessage({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8 px-4">
      <Card className="max-w-lg w-full border-destructive/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Richiesta non approvata</CardTitle>
          <CardDescription className="text-base mt-2">
            La tua richiesta di iscrizione non è stata approvata. Questo può accadere se i dati forniti non corrispondono ai requisiti di residenza.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What to do */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Cosa fare
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">
                  Controlla la tua <strong>email</strong> per maggiori dettagli sul motivo del rifiuto
                  {userEmail && (
                    <span className="block text-muted-foreground mt-1">
                      all&apos;indirizzo: <span className="font-mono text-xs">{userEmail}</span>
                    </span>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <span className="text-sm">
                  Se ritieni ci sia stato un <strong>errore</strong>, contatta il comitato di quartiere
                </span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Per assistenza, scrivi a: <span className="font-medium">comitato@pratorinaldo.it</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
