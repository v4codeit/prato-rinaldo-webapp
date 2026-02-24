import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function ProgressStep({
  icon,
  label,
  done,
  active,
}: {
  icon: string;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
      done ? "bg-teal-50 dark:bg-teal-950/30" : active ? "bg-amber-50 dark:bg-amber-950/30" : "bg-slate-50 dark:bg-slate-800/30"
    )}>
      <span className="text-lg">{icon}</span>
      <span className={cn(
        "text-sm font-medium",
        done ? "text-teal-700 dark:text-teal-400" : active ? "text-amber-700 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
      )}>
        {label}
      </span>
    </div>
  );
}

function PendingMessage({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8 px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto">
        {/* Animated welcome illustration */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <Clock className="h-10 w-10 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <span className="text-lg">&#x1F44B;</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Benvenuto nella community!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            La tua registrazione è stata ricevuta. Un amministratore la verificherà entro 24-48 ore.
          </p>
        </div>

        {/* Progress steps */}
        <div className="w-full space-y-3">
          <ProgressStep
            icon="&#x2705;"
            label="Registrazione completata"
            done
          />
          <ProgressStep
            icon="&#x23F3;"
            label="Verifica in corso"
            active
          />
          <ProgressStep
            icon="&#x1F389;"
            label="Accesso completo"
          />
        </div>

        {userEmail && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Ti invieremo una notifica a <span className="font-medium">{userEmail}</span>
          </p>
        )}
      </div>
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
