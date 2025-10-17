import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { 
  User, 
  Trophy, 
  Activity, 
  Settings, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  Award,
  ShoppingBag,
  MessageSquare,
  CalendarDays,
  Shield,
  Users,
  Home,
  BookOpen,
  Star,
  TrendingUp,
  Bell,
  LayoutDashboard
} from "lucide-react";

import { ProfileLoadingSkeleton } from "@/components/ProfileLoadingSkeleton";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
  });

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profilo aggiornato con successo!");
    },
    onError: (error) => {
      toast.error("Errore durante l'aggiornamento: " + error.message);
    },
  });

  // Queries
  const userBadgesQuery = trpc.gamification.getUserBadges.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  const userPointsQuery = trpc.gamification.getUserPoints.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  const allBadgesQuery = trpc.gamification.listBadges.useQuery(undefined, {
    enabled: !!user && user?.verificationStatus === 'approved',
  });

  const activitiesQuery = trpc.users.getActivities.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  const announcementsQuery = trpc.announcements.list.useQuery(undefined, {
    enabled: !!user && user?.verificationStatus === 'approved',
  });

  const upcomingEventsQuery = trpc.events.listPrivate.useQuery(undefined, {
    enabled: !!user && user?.verificationStatus === 'approved',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // ✅ CRITICAL FIX: Check auth loading first
  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accesso Richiesto</CardTitle>
            <CardDescription>
              Devi effettuare l'accesso per visualizzare il tuo profilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={"/login"}>
              <Button>Accedi</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMembershipTypeLabel = (type: string | null) => {
    switch (type) {
      case "resident": return "Residente";
      case "domiciled": return "Domiciliato";
      case "landowner": return "Proprietario Terreno";
      default: return "Non specificato";
    }
  };

  const getCommitteeRoleLabel = (role: string | null) => {
    switch (role) {
      case "president": return "Presidente";
      case "vice_president": return "Vice Presidente";
      case "secretary": return "Segretario";
      case "treasurer": return "Tesoriere";
      case "board_member": return "Membro del Direttivo";
      case "council_member": return "Consigliere";
      default: return null;
    }
  };

  // ✅ CRITICAL FIX: Check ALL query loading states
  const isLoadingData = 
    userBadgesQuery.isLoading ||
    userPointsQuery.isLoading ||
    allBadgesQuery.isLoading ||
    activitiesQuery.isLoading ||
    announcementsQuery.isLoading ||
    upcomingEventsQuery.isLoading;

  if (isLoadingData) {
    return <ProfileLoadingSkeleton />;
  }

  // ✅ Check for errors
  if (activitiesQuery.isError) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Errore</CardTitle>
            <CardDescription>
              Impossibile caricare le attività. Riprova più tardi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Ricarica Pagina</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ ORA è GARANTITO che tutti i dati siano disponibili
  const totalPoints = (userPointsQuery.data as any)?.totalPoints || userPointsQuery.data || 0;
  const userBadges = userBadgesQuery.data!; // Non-null assertion sicura
  const allBadges = allBadgesQuery.data!;
  const activities = activitiesQuery.data!;
  const announcements = announcementsQuery.data!;
  const upcomingEvents = upcomingEventsQuery.data!;
  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge.id) || []);

  const quickActions = [
    { title: "Eventi", icon: Calendar, href: "/eventi", color: "text-primary" },
    { title: "Marketplace", icon: ShoppingBag, href: "/marketplace", color: "text-secondary" },
    { title: "Professionisti", icon: Users, href: "/professionisti", color: "text-primary" },
    { title: "Forum", icon: MessageSquare, href: "/forum", color: "text-secondary" },
  ];

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-600"></div>
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shadow-lg">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-teal-600" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{user.name || "Utente"}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {user.verificationStatus === 'approved' && (
                    <Badge variant="default" className="bg-green-600">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificato
                    </Badge>
                  )}
                  {user.verificationStatus === 'pending' && (
                    <Badge variant="secondary">
                      <Bell className="w-3 h-3 mr-1" />
                      In attesa di verifica
                    </Badge>
                  )}
                  {getCommitteeRoleLabel(user.committeeRole) && (
                    <Badge variant="secondary" className="bg-teal-600 text-white">
                      {getCommitteeRoleLabel(user.committeeRole)}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Trophy className="w-3 h-3 mr-1" />
                    {userBadges.length} Badge
                  </Badge>
                  <Badge variant="outline">
                    <Star className="w-3 h-3 mr-1" />
                    {totalPoints} Punti
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Info
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Badge
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Attività
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Impostazioni
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PANORAMICA (da Dashboard) */}
        <TabsContent value="overview" className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Benvenuto, {user.name}!</h2>
            <p className="text-lg text-muted-foreground">Ecco cosa sta succedendo nella tua comunità</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">I tuoi Badge</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userBadges.length}</div>
                <p className="text-xs text-muted-foreground">{totalPoints} punti totali</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prossimi Eventi</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingEvents.length}</div>
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

          {/* Quick Actions */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Azioni Rapide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <Icon className={`h-8 w-8 mb-2 ${action.color}`} />
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Annunci */}
          {announcements.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold">Annunci Recenti</h3>
              <div className="space-y-4">
                {(announcements || []).slice(0, 3).map((announcement) => (
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
        </TabsContent>

        {/* TAB 2: INFORMAZIONI PERSONALI */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informazioni Residenza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo di Appartenenza</Label>
                  <p className="font-medium">{getMembershipTypeLabel(user.membershipType)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stato Verifica</Label>
                  <p className="font-medium capitalize">{user.verificationStatus === 'approved' ? 'Approvato' : user.verificationStatus === 'pending' ? 'In attesa' : 'Rifiutato'}</p>
                </div>
              </div>

              {user.street && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Indirizzo Completo</Label>
                  <p className="font-medium">
                    {user.street} {user.streetNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.zipCode} {user.municipality === 'san_cesareo' ? 'San Cesareo' : 'Zagarolo'}, Roma
                  </p>
                </div>
              )}

              {(user.membershipType === 'resident' || user.membershipType === 'domiciled') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-muted-foreground">Nucleo Familiare</Label>
                    <p className="font-medium">{user.householdSize || 0} persone</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Minori</Label>
                    <p className="font-medium">{user.hasMinors ? `${user.minorsCount || 0}` : 'Nessuno'}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Membro dal
                </Label>
                <p className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BADGE & GAMIFICATION (merge da Badges page) */}
        <TabsContent value="badges" className="space-y-8">
          {/* Hero Card Punti */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-primary" />
                I Tuoi Punti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">{totalPoints}</div>
              <p className="text-muted-foreground mt-2">
                {userBadges.length} badge guadagnati
              </p>
            </CardContent>
          </Card>

          {/* I Tuoi Badge */}
          {userBadges.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Award className="h-6 w-6" />
                I Tuoi Badge
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(userBadges || []).map(({ userBadge, badge }) => (
                  <Card key={userBadge.id} className="border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-primary" />
                            {badge.name}
                          </CardTitle>
                          {badge.description && (
                            <CardDescription className="mt-2">{badge.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">{badge.points} pt</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Guadagnato il {new Date(userBadge.earnedAt!).toLocaleDateString('it-IT')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Tutti i Badge Disponibili */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Tutti i Badge Disponibili</h2>
            {allBadges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(allBadges || []).map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  return (
                    <Card key={badge.id} className={isEarned ? "" : "opacity-60"}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {isEarned ? (
                                <Star className="h-5 w-5 text-primary" />
                              ) : (
                                <Star className="h-5 w-5 text-muted-foreground" />
                              )}
                              {badge.name}
                            </CardTitle>
                            {badge.description && (
                              <CardDescription className="mt-2">{badge.description}</CardDescription>
                            )}
                          </div>
                          <Badge variant={isEarned ? "default" : "outline"}>{badge.points} pt</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nessun badge disponibile al momento</p>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* TAB 4: LE MIE ATTIVITÀ */}
        <TabsContent value="activity" className="space-y-6">
          {/* Eventi Futuri Senza Risposta */}
          {activities?.events?.upcoming && activities.events.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Eventi Futuri - Rispondi!
                </CardTitle>
                <CardDescription>Eventi ai quali non hai ancora risposto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(activities?.events?.upcoming || []).map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <Link href={`/eventi`}>
                        <Button size="sm">Rispondi</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eventi con RSVP */}
          {activities?.events?.rsvps && activities.events.rsvps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Eventi Confermati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(activities?.events?.rsvps || []).map((item: any) => (
                    <div key={item.rsvp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.event.startDate).toLocaleDateString('it-IT')} - 
                          <Badge variant="outline" className="ml-2">{item.rsvp.status}</Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marketplace Items */}
          {activities?.marketplace?.active && activities.marketplace.active.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  I Miei Annunci Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(activities?.marketplace?.active || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          €{item.price} - 
                          <Badge variant="outline" className="ml-2">{item.status}</Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forum Threads */}
          {activities?.forum?.threads && activities.forum.threads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  I Miei Thread nel Forum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(activities?.forum?.threads || []).map((thread: any) => (
                    <div key={thread.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{thread.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(thread.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 5: IMPOSTAZIONI */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Modifica Profilo</CardTitle>
              <CardDescription>Aggiorna le tue informazioni personali</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Il tuo nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Parlaci di te..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

