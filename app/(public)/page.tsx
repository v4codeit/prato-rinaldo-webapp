import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { Calendar, ShoppingBag, Users, MessageSquare, FileText, Briefcase } from 'lucide-react';
import { getCachedUserMinimal } from '@/lib/auth/cached-user';

export default async function HomePage() {
  // Fetch current user (returns null if not authenticated)
  const user = await getCachedUserMinimal();

  const features = [
    {
      icon: Users,
      title: 'Community',
      description: 'Unisciti alla community locale e partecipa alla vita del quartiere',
      href: ROUTES.FEED,
    },
    {
      icon: Calendar,
      title: 'Eventi',
      description: 'Scopri e partecipa agli eventi organizzati dalla community',
      href: ROUTES.EVENTS,
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Compra e vendi articoli usati sostenendo il comitato',
      href: ROUTES.MARKETPLACE,
    },
    {
      icon: Briefcase,
      title: 'Community Pro',
      description: 'Trova volontari e professionisti locali pronti ad aiutarti',
      href: ROUTES.COMMUNITY_PRO,
    },
    {
      icon: MessageSquare,
      title: 'Agorà',
      description: 'Proponi iniziative, vota le idee della community e segui la roadmap',
      href: ROUTES.AGORA,
    },
    {
      icon: FileText,
      title: 'Risorse',
      description: 'Accedi a documenti, tutorial e guide utili',
      href: ROUTES.RESOURCES,
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Benvenuto in {APP_NAME}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              La piattaforma digitale che unisce la community del Comitato di Quartiere Prato Rinaldo.
              Scopri eventi, partecipa alle discussioni e connettiti con i tuoi vicini.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Button size="lg" asChild>
                  <Link href={ROUTES.REGISTER}>Unisciti alla Community</Link>
                </Button>
              )}
              {user && (
                <Button size="lg" asChild>
                  <Link href={ROUTES.BACHECA}>Vai alla Bacheca</Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="hover:bg-primary/10 hover:text-primary hover:border-primary">
                <Link href={ROUTES.EVENTS}>Scopri gli Eventi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Esplora la Piattaforma</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scopri tutte le funzionalità disponibili per i membri della community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.title} href={feature.href}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="mb-2 rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Only for non-authenticated users */}
      {!user && (
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold mb-4">
                Pronto a far parte della community?
              </h2>
              <p className="text-muted-foreground mb-8">
                Registrati ora per accedere a tutte le funzionalità e iniziare a partecipare
                attivamente alla vita del quartiere.
              </p>
              <Button size="lg" asChild>
                <Link href={ROUTES.REGISTER}>Registrati Gratis</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
