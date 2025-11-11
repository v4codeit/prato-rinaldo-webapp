'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Users,
  Star,
  TrendingUp,
  Shield,
  Award,
  ArrowRight,
} from 'lucide-react';

/**
 * Create Professional Profile CTA Component
 *
 * Empty state when user doesn't have a professional profile
 * - Hero section with benefits
 * - Visual mockup/preview
 * - Clear CTA to create profile
 *
 * Mobile-first responsive
 */
export function CreateProfileCta() {
  const router = useRouter();

  const benefits = [
    {
      icon: Users,
      title: 'Raggiungi la Community',
      description: 'Oltre 1000+ membri attivi cercano professionisti locali',
    },
    {
      icon: Star,
      title: 'Costruisci Reputazione',
      description: 'Ricevi recensioni e feedback dai clienti soddisfatti',
    },
    {
      icon: TrendingUp,
      title: 'Aumenta la Visibilità',
      description: 'Appari nelle ricerche e categorie professionali',
    },
    {
      icon: Shield,
      title: 'Profilo Verificato',
      description: 'Badge di verifica per aumentare la fiducia',
    },
    {
      icon: Award,
      title: 'Portfolio Visivo',
      description: 'Mostra i tuoi lavori con foto e certificazioni',
    },
    {
      icon: Briefcase,
      title: 'Gestione Semplice',
      description: 'Aggiorna disponibilità e servizi in tempo reale',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Diventa un Professionista della Community
          </CardTitle>
          <CardDescription className="text-base md:text-lg mt-2">
            Offri i tuoi servizi, costruisci la tua reputazione e connettiti con
            migliaia di potenziali clienti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CTA Button - Mobile full width */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base h-12"
              onClick={() => router.push('/community-pro/new')}
            >
              Crea il Tuo Profilo Professionale
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base h-12"
              onClick={() => router.push('/community-pro')}
            >
              Esplora Professionisti
            </Button>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">1000+</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                Membri Attivi
              </div>
            </div>
            <div className="text-center border-x">
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                Professionisti
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">95%</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                Soddisfazione
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{benefit.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {benefit.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Example Preview Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Come Funziona?</CardTitle>
          <CardDescription>
            Creare il tuo profilo professionale è semplice e veloce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Compila i Tuoi Dati</div>
                <div className="text-sm text-muted-foreground">
                  Nome attività, categoria, servizi offerti e tariffe
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Aggiungi Portfolio</div>
                <div className="text-sm text-muted-foreground">
                  Carica foto dei tuoi lavori e certificazioni
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Pubblica e Inizia</div>
                <div className="text-sm text-muted-foreground">
                  Il tuo profilo sarà visibile nella directory professionale
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
