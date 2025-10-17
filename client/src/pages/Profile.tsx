import { useEffect, useState } from "react";
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
  Users
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
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

  const userBadgesQuery = trpc.gamification.getUserBadges.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  const userPointsQuery = trpc.gamification.getUserPoints.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  const activitiesQuery = trpc.users.getActivities.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

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

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Caricamento profilo...</p>
          </div>
        </div>
      </div>
    );
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
            <Button asChild>
              <a href={getLoginUrl()}>Accedi</a>
            </Button>
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

  const totalPoints = (userPointsQuery.data as any)?.totalPoints || userPointsQuery.data || 0;
  const userBadges = userBadgesQuery.data || [];
  const activities = activitiesQuery.data;

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
                {user.committeeRole && (
                  <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white rounded-full p-2 shadow-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">
                        {getMembershipTypeLabel(user.membershipType)}
                      </Badge>
                      {user.committeeRole && (
                        <Badge className="bg-orange-500 hover:bg-orange-600">
                          <Shield className="w-3 h-3 mr-1" />
                          {getCommitteeRoleLabel(user.committeeRole)}
                        </Badge>
                      )}
                      {user.verificationStatus === "approved" && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Verificato
                        </Badge>
                      )}
                      {user.verificationStatus === "pending" && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                          In attesa di verifica
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-2xl font-bold text-teal-600">
                        <Trophy className="w-6 h-6" />
                        {totalPoints}
                      </div>
                      <p className="text-sm text-muted-foreground">Punti</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-2xl font-bold text-orange-600">
                        <Award className="w-6 h-6" />
                        {userBadges.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Badge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Informazioni</span>
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Gamification</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Attività</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Impostazioni</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Informazioni Personali */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Personali</CardTitle>
              <CardDescription>
                Visualizza i tuoi dati personali e di residenza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-lg">{user.email || "Non specificata"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    Telefono
                  </div>
                  <p className="text-lg">{user.phone || "Non specificato"}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    Indirizzo
                  </div>
                  {user.street && user.streetNumber ? (
                    <p className="text-lg">
                      {user.street} {user.streetNumber}, {user.zipCode || "00030"} - {user.municipality === "san_cesareo" ? "San Cesareo" : "Zagarolo"}
                    </p>
                  ) : (
                    <p className="text-lg text-muted-foreground">Non specificato</p>
                  )}
                </div>

                {(user.membershipType === "resident" || user.membershipType === "domiciled") && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="w-4 h-4" />
                        Nucleo Familiare
                      </div>
                      <p className="text-lg">{user.householdSize || 1} {user.householdSize === 1 ? "persona" : "persone"}</p>
                    </div>

                    {user.hasMinors && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Minori
                        </div>
                        <p className="text-lg">{user.minorsCount || 0}</p>
                      </div>
                    )}

                    {user.hasSeniors && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Anziani (over 65)
                        </div>
                        <p className="text-lg">{user.seniorsCount || 0}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Membro dal
                  </div>
                  <p className="text-lg">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("it-IT") : "N/A"}
                  </p>
                </div>
              </div>

              {user.bio && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground">
                    Bio
                  </div>
                  <p className="text-lg">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gamification & Badge */}
        <TabsContent value="gamification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-teal-600" />
                I Tuoi Badge
              </CardTitle>
              <CardDescription>
                Hai guadagnato {userBadges.length} badge contribuendo alla comunità
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBadges.map((userBadge: any) => (
                    <Card key={userBadge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                            {userBadge.badge.icon ? (
                              <img src={userBadge.badge.icon} alt={userBadge.badge.name} className="w-10 h-10" />
                            ) : (
                              <Award className="w-8 h-8 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{userBadge.badge.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {userBadge.badge.description}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary" className="text-xs">
                                +{userBadge.badge.points} punti
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(userBadge.earnedAt).toLocaleDateString("it-IT")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Non hai ancora guadagnato badge. Partecipa alle attività della comunità per guadagnarne!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classifica Punti</CardTitle>
              <CardDescription>
                Hai totalizzato {totalPoints} punti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-4xl font-bold text-white">{totalPoints}</span>
                  </div>
                  <p className="text-lg font-semibold">Punti Totali</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Continua a contribuire per salire in classifica!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Le Mie Attività */}
        <TabsContent value="activities" className="space-y-6">
          {/* Eventi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600" />
                Eventi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {activities?.events.upcoming && activities.events.upcoming.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Prossimi Eventi con RSVP</h3>
                  <div className="space-y-2">
                    {activities.events.upcoming.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                        <Badge>Confermato</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activities?.events.past && activities.events.past.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Eventi Passati</h3>
                  <div className="space-y-2">
                    {activities.events.past.slice(0, 5).map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-muted-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                        <Badge variant="secondary">Partecipato</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!activities?.events.upcoming || activities.events.upcoming.length === 0) && 
               (!activities?.events.past || activities.events.past.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun evento a cui hai partecipato</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {activities?.marketplace.active && activities.marketplace.active.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Annunci Attivi</h3>
                  <div className="space-y-2">
                    {activities.marketplace.active.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">€{item.price}</p>
                        </div>
                        <Badge className="bg-green-500">Disponibile</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activities?.marketplace.sold && activities.marketplace.sold.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Venduti</h3>
                  <div className="space-y-2">
                    {activities.marketplace.sold.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-muted-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">€{item.price}</p>
                        </div>
                        <Badge variant="secondary">Venduto</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!activities?.marketplace.active || activities.marketplace.active.length === 0) && 
               (!activities?.marketplace.sold || activities.marketplace.sold.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun annuncio pubblicato</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forum */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Attività Forum
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities?.forum.threads && activities.forum.threads.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold mb-3">Discussioni Avviate</h3>
                  {activities.forum.threads.map((thread: any) => (
                    <div key={thread.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                      <p className="font-medium">{thread.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(thread.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {(!activities?.forum.threads || activities.forum.threads.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nessuna attività nel forum</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Impostazioni */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modifica Profilo</CardTitle>
              <CardDescription>
                Aggiorna le tue informazioni personali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Raccontaci qualcosa di te..."
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

