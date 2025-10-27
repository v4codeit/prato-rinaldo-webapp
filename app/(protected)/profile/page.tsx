'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/molecules/form-field';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { getCurrentUser, updateProfile, getUserBadges, getUserPoints } from '@/app/actions/users';
import { getMyItems } from '@/app/actions/marketplace';
import { getMyProfessionalProfile } from '@/app/actions/service-profiles';
import { Award, User, ShoppingBag, Briefcase, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [points, setPoints] = useState({ totalPoints: 0, level: 1 });
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [professional, setProfessional] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [userResult, badgesResult, pointsResult, itemsResult, professionalResult] = await Promise.all([
      getCurrentUser(),
      getUserBadges('current'),
      getUserPoints('current'),
      getMyItems(),
      getMyProfessionalProfile(),
    ]);

    if (userResult.user) setUser(userResult.user);
    if (badgesResult.badges) setBadges(badgesResult.badges);
    if (pointsResult) setPoints(pointsResult);
    if (itemsResult.items) setMarketplaceItems(itemsResult.items);
    if (professionalResult.professional) setProfessional(professionalResult.professional);

    setLoading(false);
  }

  async function handleUpdateProfile(formData: FormData) {
    setSaving(true);

    const result = await updateProfile(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Profilo aggiornato con successo');
      loadData();
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Errore</CardTitle>
            <CardDescription>Impossibile caricare il profilo</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Il Mio Profilo</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo profilo e visualizza le tue attività
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="h-4 w-4 mr-2" />
            Badge ({badges.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <MessageSquare className="h-4 w-4 mr-2" />
            Attività
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            {/* Profile Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Profilo</CardTitle>
                <CardDescription>
                  Aggiorna le tue informazioni personali
                </CardDescription>
              </CardHeader>
              <form action={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <FormField
                    label="Nome"
                    name="name"
                    type="text"
                    defaultValue={user.name}
                    required
                  />
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    disabled
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      name="bio"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                      placeholder="Raccontaci qualcosa di te..."
                      defaultValue={user.bio || ''}
                    />
                  </div>
                  <FormField
                    label="Telefono"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone || ''}
                  />
                </CardContent>
                <div className="p-6 pt-0">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Verification Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Stato Verifica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Stato di verifica</p>
                    <p className="text-sm text-muted-foreground">
                      {user.verification_status === 'approved' && 'Verificato'}
                      {user.verification_status === 'pending' && 'In attesa di verifica'}
                      {user.verification_status === 'rejected' && 'Rifiutato'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      user.verification_status === 'approved'
                        ? 'default'
                        : user.verification_status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {user.verification_status}
                  </Badge>
                </div>
                {user.membership_type && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Tipo di appartenenza</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.membership_type.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <div className="grid gap-6">
            {/* Level Card */}
            <Card>
              <CardHeader>
                <CardTitle>Livello {points.level}</CardTitle>
                <CardDescription>
                  {points.totalPoints} punti totali
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso verso il livello {points.level + 1}</span>
                    <span className="font-medium">
                      {points.totalPoints % 100}/100 punti
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(points.totalPoints % 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Non hai ancora guadagnato nessun badge
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Partecipa alle attività per guadagnare badge e punti!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                badges.map((userBadge: any) => (
                  <Card key={userBadge.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{userBadge.badge?.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {userBadge.badge?.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            +{userBadge.badge?.points} punti
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {userBadge.badge?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ottenuto il{' '}
                        {new Date(userBadge.earned_at).toLocaleDateString('it-IT')}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="space-y-6">
            {/* Marketplace Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <CardTitle>I Miei Annunci</CardTitle>
                </div>
                <CardDescription>
                  {marketplaceItems.length} annunci pubblicati
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketplaceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Non hai ancora pubblicato annunci
                  </p>
                ) : (
                  <div className="space-y-2">
                    {marketplaceItems.slice(0, 5).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            €{item.price} • {item.status}
                          </p>
                        </div>
                        <Badge variant={item.is_sold ? 'secondary' : 'default'}>
                          {item.is_sold ? 'Venduto' : 'Disponibile'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Profile */}
            {professional && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    <CardTitle>Profilo Professionale</CardTitle>
                  </div>
                  <CardDescription>{professional.business_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Categoria</p>
                      <p className="text-sm text-muted-foreground">
                        {professional.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Stato</p>
                      <Badge
                        variant={
                          professional.status === 'approved'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {professional.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
