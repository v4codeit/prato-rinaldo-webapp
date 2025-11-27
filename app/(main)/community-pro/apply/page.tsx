'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ApplyDisambiguationPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header con back button */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/community-pro">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna a Community Pro
            </Link>
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Scegli il Tipo di Profilo
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Seleziona se vuoi candidarti come volontario o come professionista
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volunteer Card */}
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Volontario</CardTitle>
              </div>
              <CardDescription className="text-base">
                Offri il tuo aiuto gratuitamente alla community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Servizi gratuiti o con rimborso spese</li>
                <li>• Aiuta la community di Prato Rinaldo</li>
                <li>• Metti a disposizione il tuo tempo</li>
                <li>• Nessun logo richiesto</li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/community-pro/apply/volunteer">
                  Candidati come Volontario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Professional Card */}
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Professionista</CardTitle>
              </div>
              <CardDescription className="text-base">
                Promuovi la tua attività professionale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Servizi professionali a pagamento</li>
                <li>• Promuovi la tua attività</li>
                <li>• Logo e indirizzo richiesti</li>
                <li>• Indicazione tariffe opzionale</li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/community-pro/apply/professional">
                  Candidati come Professionista
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Nota:</strong> La candidatura verrà inviata in moderazione.
            Riceverai una email quando sarà approvata e il tuo profilo sarà visibile nella Community Pro.
          </p>
        </div>
      </div>
    </div>
  );
}
