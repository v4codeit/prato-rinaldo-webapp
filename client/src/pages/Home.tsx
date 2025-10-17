import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, ShoppingBag, Users, BookOpen, MessageSquare, Trophy, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: articles } = trpc.articles.list.useQuery({ tenantId: "prato-rinaldo-default", limit: 3 });
  const { data: events } = trpc.events.listPublic.useQuery({ tenantId: "prato-rinaldo-default" });

  const features = [
    {
      icon: Calendar,
      title: "Eventi",
      description: "Scopri e partecipa agli eventi della comunità",
      href: "/eventi",
      color: "text-primary",
    },
    {
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Compra e vendi oggetti usati nella comunità",
      href: "/marketplace",
      color: "text-secondary",
    },
    {
      icon: Users,
      title: "Professionisti",
      description: "Trova professionisti e volontari del quartiere",
      href: "/professionisti",
      color: "text-primary",
    },
    {
      icon: BookOpen,
      title: "Risorse",
      description: "Guide e tutorial per i servizi digitali",
      href: "/risorse",
      color: "text-secondary",
    },
    {
      icon: MessageSquare,
      title: "Forum",
      description: "Discuti con gli altri residenti",
      href: "/forum",
      color: "text-primary",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Guadagna badge contribuendo alla comunità",
      href: "/badges",
      color: "text-secondary",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Benvenuto a <span className="text-primary">Prato Rinaldo</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La piattaforma digitale del comitato cittadini di Prato Rinaldo. 
              Connetti, condividi e partecipa alla vita della nostra comunità.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link href="/profilo" className="flex items-center gap-2">
                    Vai al Profilo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <a href={getLoginUrl()}>Accedi</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/chi-siamo">
                      Scopri di più
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cosa Puoi Fare</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Esplora tutte le funzionalità della piattaforma pensate per migliorare la vita nel quartiere
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className={`h-10 w-10 mb-2 ${feature.color}`} />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="w-full">
                    <Link href={feature.href} className="flex items-center justify-center gap-2">
                      Esplora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      {articles && articles.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Ultime Notizie</h2>
              <Button variant="outline" asChild>
                <Link href="/notizie">
                  Vedi tutte
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href={`/notizie/${article.slug}`}>
                        Leggi di più
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events && events.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Prossimi Eventi</h2>
              <Button variant="outline" asChild>
                <Link href="/eventi">
                  Vedi tutti
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {event.coverImage && (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <CardDescription>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(event.startDate).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href={`/eventi/${event.id}`}>
                        Dettagli
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Unisciti alla Comunità</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Registrati per accedere a tutte le funzionalità riservate ai residenti di Prato Rinaldo
            </p>
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>Registrati Ora</a>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

