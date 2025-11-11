'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function PrivateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Private route error:', error);
  }, [error]);

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="container py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl">Errore di Caricamento</CardTitle>
          <CardDescription className="text-base">
            Si è verificato un errore durante il caricamento della pagina
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info (solo in sviluppo):
              </p>
              <pre className="text-xs font-mono overflow-auto text-foreground">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Torna alla Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
