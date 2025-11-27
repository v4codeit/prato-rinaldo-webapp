'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/utils/constants';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sei Offline</h1>
          <p className="text-muted-foreground">
            Sembra che tu non sia connesso a Internet.
            <br />
            Controlla la tua connessione e riprova.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Torna Indietro
          </Button>
        </div>

        {/* Tips */}
        <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
          <p className="font-medium">Suggerimenti:</p>
          <ul className="list-disc list-inside text-left space-y-1">
            <li>Verifica che il Wi-Fi o i dati mobili siano attivi</li>
            <li>Prova a disattivare e riattivare la connessione</li>
            <li>Se il problema persiste, contatta il tuo provider</li>
          </ul>
        </div>

        {/* Branding */}
        <p className="text-xs text-muted-foreground pt-4">
          {APP_NAME}
        </p>
      </div>
    </div>
  );
}
