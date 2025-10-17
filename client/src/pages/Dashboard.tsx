import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, ShoppingBag, Users, MessageSquare, Trophy, Bell, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: announcements } = trpc.announcements.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: upcomingEvents } = trpc.events.listPrivate.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: userBadges } = trpc.gamification.getUserBadges.useQuery({ userId: user?.id }, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: userPoints } = trpc.gamification.getUserPoints.useQuery({ userId: user?.id }, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  if (user?.verificationStatus === 'pending') {
    return (
      <div className="container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-warning" />
              Account in attesa di verifica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Il tuo account è in attesa di verifica da parte del comitato.</p>
            <Button asChild>
              <Link href="/"><a>Torna alla Home</a></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    { title: "Eventi", icon: Calendar, href: "/eventi", color: "text-primary" },
    { title: "Marketplace", icon: ShoppingBag, href: "/marketplace", color: "text-secondary" },
    { title: "Professionisti", icon: Users, href: "/professionisti", color: "text-primary" },
    { title: "Forum", icon: MessageSquare, href: "/forum", color: "text-secondary" },
  ];

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Benvenuto, {user?.name}!</h1>
        <p className="text-lg text-muted-foreground">Ecco cosa sta succedendo nella tua comunità</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">I tuoi Badge</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBadges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{userPoints || 0} punti totali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prossimi Eventi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Eventi in programma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attività</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Attivo</div>
            <p className="text-xs text-muted-foreground">Membro verificato</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={action.href}>
                <a>
                  <CardHeader>
                    <action.icon className={`h-8 w-8 mb-2 ${action.color}`} />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                </a>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {announcements && announcements.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Annunci</h2>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex-1">{announcement.title}</CardTitle>
                    {announcement.isPinned && <Badge variant="secondary">In evidenza</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

