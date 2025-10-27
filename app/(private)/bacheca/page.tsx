import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/utils/constants';
import { getAllEvents } from '@/app/actions/events';
import { getApprovedItems } from '@/app/actions/marketplace';
import {
  Calendar,
  ShoppingBag,
  MessageSquare,
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Bacheca Personale',
  description: 'La tua bacheca personale su Prato Rinaldo',
};

export default async function BachecaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, verification_status, avatar, created_at')
    .eq('id', user.id)
    .single() as { data: { name: string; verification_status: string; avatar?: string; created_at: string } | null };

  // Get recent events and marketplace items
  const { events } = await getAllEvents();
  const { items } = await getApprovedItems();

  const isVerified = profile?.verification_status === 'approved';

  const quickLinks = [
    {
      icon: Calendar,
      title: 'Eventi',
      description: 'Scopri i prossimi eventi',
      href: ROUTES.EVENTS,
      color: 'bg-blue-500',
      count: events.length,
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Annunci e scambi',
      href: ROUTES.MARKETPLACE,
      color: 'bg-green-500',
      count: items.length,
    },
    {
      icon: MessageSquare,
      title: 'Agorà',
      description: 'Proposte civiche',
      href: ROUTES.AGORA,
      color: 'bg-purple-500',
      disabled: !isVerified,
    },
    {
      icon: Users,
      title: 'Community Pro',
      description: 'Volontari e professionisti',
      href: ROUTES.COMMUNITY_PRO,
      color: 'bg-orange-500',
    },
    {
      icon: FileText,
      title: 'Risorse',
      description: 'Documenti e tutorial',
      href: ROUTES.RESOURCES,
      color: 'bg-teal-500',
      disabled: !isVerified,
    },
    {
      icon: Briefcase,
      title: 'Il Mio Profilo',
      description: 'Gestisci account',
      href: ROUTES.PROFILE,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          {profile?.avatar && (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">
              Benvenuto, {profile?.name || 'Utente'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Questa è la tua bacheca personale
            </p>
          </div>
          {!isVerified && (
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              Verifica in corso
            </Badge>
          )}
          {isVerified && (
            <Badge variant="default" className="text-sm bg-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Verificato
            </Badge>
          )}
        </div>

        {!isVerified && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Completa la verifica</CardTitle>
              <CardDescription>
                Completa la verifica del tuo profilo per accedere ad Agorà, Risorse e tutte le funzionalità esclusive della community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={ROUTES.PROFILE}>Vai al Profilo</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className={link.disabled ? 'pointer-events-none opacity-50' : ''}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`rounded-lg ${link.color} p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {link.count !== undefined && (
                      <Badge variant="secondary">{link.count}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
          <CardDescription>
            Rimani aggiornato sulle ultime novità della community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Prossimi eventi */}
            {events.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Prossimi Eventi
                </h3>
                <div className="space-y-2">
                  {events.slice(0, 3).map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                      </div>
                      {event.is_private && (
                        <Badge variant="secondary" className="text-xs">
                          Privato
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" asChild className="w-full mt-2">
                  <Link href={ROUTES.EVENTS}>Vedi tutti gli eventi</Link>
                </Button>
              </div>
            )}

            {/* Nuovi annunci marketplace */}
            {items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Nuovi Annunci
                </h3>
                <div className="space-y-2">
                  {items.slice(0, 3).map((item: any) => (
                    <Link
                      key={item.id}
                      href={`${ROUTES.MARKETPLACE}/${item.id}`}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          di {item.seller.name}
                        </div>
                      </div>
                      <div className="font-bold text-primary">{item.price}€</div>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" asChild className="w-full mt-2">
                  <Link href={ROUTES.MARKETPLACE}>Vedi tutti gli annunci</Link>
                </Button>
              </div>
            )}

            {events.length === 0 && items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna attività recente. Esplora le sezioni per iniziare!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
