'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';

export default function MarketplaceItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketplace item error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl">Errore Caricamento Annuncio</CardTitle>
            <CardDescription className="text-base">
              Si è verificato un errore durante il caricamento dell'annuncio
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex gap-2 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.MARKETPLACE}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna al Marketplace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
