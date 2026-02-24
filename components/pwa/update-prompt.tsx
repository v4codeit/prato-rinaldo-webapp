'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppUpdate } from '@/hooks/use-app-update';

/**
 * Shows a fixed banner when a new app version is available.
 * User clicks "Aggiorna" to reload with the latest version.
 */
export function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Aggiornamento disponibile</p>
          <p className="text-xs text-muted-foreground">
            Una nuova versione dell&apos;app è pronta
          </p>
        </div>
        <Button size="sm" onClick={applyUpdate}>
          Aggiorna
        </Button>
      </div>
    </div>
  );
}
