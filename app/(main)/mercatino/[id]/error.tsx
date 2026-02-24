'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { ROUTES } from '@/lib/utils/constants';

export default function MercatinoItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Mercatino item error:', error);
  }, [error]);

  return (
    <div className="container py-12 pb-24">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Errore nel caricamento
        </h1>

        <p className="text-slate-600 mb-6">
          Si è verificato un errore durante il caricamento dell'annuncio.
          Riprova o torna al Mercatino.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={reset} className="rounded-full">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Riprova
          </Button>
          <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-700">
            <Link href={ROUTES.MERCATINO as Route}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al Mercatino
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-slate-400 mt-6">
            Codice errore: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
