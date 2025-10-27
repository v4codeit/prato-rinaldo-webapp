'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Qualcosa è andato storto!</h2>
        <p className="text-muted-foreground mb-6">
          Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina.
        </p>
        {error.message && (
          <pre className="bg-muted p-4 rounded-md text-sm text-left mb-6 overflow-auto">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
