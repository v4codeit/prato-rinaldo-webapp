import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ModerationDashboard from "@/components/ModerationDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart3,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Shield,
  Palette,
  Upload,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  AlertCircle
} from "lucide-react";


export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tenantSettings, setTenantSettings] = useState({
    name: "",
    description: "",
    logo: "",
    primaryColor: "#0891b2",
    secondaryColor: "#f97316",
    heroImage: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    maintenanceMode: false,
    maintenanceMessage: "",
  });

  const utils = trpc.useUtils();

  // Queries
  const statsQuery = trpc.admin.getStatistics.useQuery(undefined, { enabled: !!user });
  const pendingUsersQuery = trpc.admin.listPendingUsers.useQuery(undefined, { enabled: !!user });
  const allUsersQuery = trpc.admin.listAllUsers.useQuery(undefined, { enabled: !!user });
  const tenantSettingsQuery = trpc.admin.getTenantSettings.useQuery(undefined, { 
    enabled: !!user
  });

  // Update tenant settings when data is loaded
  if (tenantSettingsQuery.data && !tenantSettings.name) {
    const data = tenantSettingsQuery.data;
    setTenantSettings({
      name: data.name || "",
      description: data.description || "",
      logo: data.logo || "",
      primaryColor: data.primaryColor || "#0891b2",
      secondaryColor: data.secondaryColor || "#f97316",
      heroImage: data.heroImage || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      address: data.address || "",
      socialFacebook: data.socialFacebook || "",
      socialInstagram: data.socialInstagram || "",
      socialTwitter: data.socialTwitter || "",
      maintenanceMode: data.maintenanceMode || false,
      maintenanceMessage: data.maintenanceMessage || "",
    });
  }

  // Mutations
  const approveMutation = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      toast.success("Utente approvato con successo");
      utils.admin.listPendingUsers.invalidate();
      utils.admin.listAllUsers.invalidate();
    },
  });

  const rejectMutation = trpc.admin.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("Utente rifiutato");
      utils.admin.listPendingUsers.invalidate();
      utils.admin.listAllUsers.invalidate();
    },
  });

  const updateRolesMutation = trpc.admin.updateUserRoles.useMutation({
    onSuccess: () => {
      toast.success("Ruoli aggiornati con successo");
      utils.admin.listAllUsers.invalidate();
      setSelectedUser(null);
    },
  });

  const updateTenantMutation = trpc.admin.updateTenantSettings.useMutation({
    onSuccess: () => {
      toast.success("Impostazioni aggiornate con successo");
      utils.admin.getTenantSettings.invalidate();
    },
  });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi per accedere a questa sezione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={"/login"}>Accedi</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const pendingUsers = pendingUsersQuery.data || [];
  const allUsers = allUsersQuery.data || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
          Pannello Amministrazione
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestisci utenti, contenuti e configurazioni della piattaforma
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Moderazione</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utenti</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurazione</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.verifiedUsers || 0} verificati
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Attesa di Verifica</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendingUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Richieste da approvare
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventi Totali</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Organizzati
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeMarketplaceItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Annunci attivi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Discussioni Forum</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalThreads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Thread aperti
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Users Quick View */}
          {pendingUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Utenti in Attesa di Verifica</CardTitle>
                <CardDescription>
                  Approva o rifiuta le richieste di accesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.street && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {user.street} {user.streetNumber}, {user.municipality === 'san_cesareo' ? 'San Cesareo' : 'Zagarolo'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ userId: user.id })}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approva
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate({ userId: user.id })}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rifiuta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingUsers.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setActiveTab("users")}
                  >
                    Vedi tutti ({pendingUsers.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <ModerationDashboard />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Utenti</CardTitle>
              <CardDescription>
                Visualizza e gestisci tutti gli utenti della piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user: any) => (
                  <div key={user.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <Badge variant={user.verificationStatus === 'approved' ? 'default' : user.verificationStatus === 'pending' ? 'secondary' : 'destructive'}>
                            {user.verificationStatus === 'approved' ? 'Verificato' : user.verificationStatus === 'pending' ? 'In attesa' : 'Rifiutato'}
                          </Badge>
                          {user.committeeRole && (
                            <Badge className="bg-orange-500">
                              <Shield className="w-3 h-3 mr-1" />
                              {user.committeeRole}
                            </Badge>
                          )}
                          {user.adminRole && (
                            <Badge className="bg-purple-500">
                              Admin: {user.adminRole}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.street && (
                          <p className="text-sm text-muted-foreground">
                            {user.street} {user.streetNumber}, {user.municipality === 'san_cesareo' ? 'San Cesareo' : 'Zagarolo'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {user.verificationStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ userId: user.id })}
                            >
                              Approva
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate({ userId: user.id })}
                            >
                              Rifiuta
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          Gestisci Ruoli
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Management Modal */}
          {selectedUser && (
            <Card className="border-2 border-teal-500">
              <CardHeader>
                <CardTitle>Gestione Ruoli: {selectedUser.name}</CardTitle>
                <CardDescription>
                  Assegna ruoli amministrativi e di comitato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Ruolo Amministrativo</Label>
                  <Select
                    defaultValue={selectedUser.adminRole || "none"}
                    onValueChange={(value) => {
                      setSelectedUser({ ...selectedUser, adminRole: value === "none" ? null : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      <SelectItem value="moderator">Moderatore</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ruolo nel Comitato</Label>
                  <Select
                    defaultValue={selectedUser.committeeRole || "none"}
                    onValueChange={(value) => {
                      const role = value === "none" ? null : value;
                      const isBoard = ["president", "vice_president", "secretary", "treasurer"].includes(value);
                      const isCouncil = value === "council_member" || value === "board_member";
                      setSelectedUser({ 
                        ...selectedUser, 
                        committeeRole: role,
                        isInBoard: isBoard,
                        isInCouncil: isCouncil
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      <SelectItem value="president">Presidente</SelectItem>
                      <SelectItem value="vice_president">Vice Presidente</SelectItem>
                      <SelectItem value="secretary">Segretario</SelectItem>
                      <SelectItem value="treasurer">Tesoriere</SelectItem>
                      <SelectItem value="board_member">Membro del Direttivo</SelectItem>
                      <SelectItem value="council_member">Consigliere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      updateRolesMutation.mutate({
                        userId: selectedUser.id,
                        adminRole: selectedUser.adminRole,
                        committeeRole: selectedUser.committeeRole,
                        isInBoard: selectedUser.isInBoard,
                        isInCouncil: selectedUser.isInCouncil,
                      });
                    }}
                    disabled={updateRolesMutation.isPending}
                  >
                    Salva Modifiche
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding e Aspetto
              </CardTitle>
              <CardDescription>
                Personalizza logo, colori e immagini della piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Piattaforma</Label>
                <Input
                  id="name"
                  value={tenantSettings.name}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={tenantSettings.description}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">URL Logo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      placeholder="https://..."
                      value={tenantSettings.logo}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, logo: e.target.value })}
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heroImage">URL Immagine Hero</Label>
                  <div className="flex gap-2">
                    <Input
                      id="heroImage"
                      placeholder="https://..."
                      value={tenantSettings.heroImage}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, heroImage: e.target.value })}
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Colore Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={tenantSettings.primaryColor}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={tenantSettings.primaryColor}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, primaryColor: e.target.value })}
                      placeholder="#0891b2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Colore Secondario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={tenantSettings.secondaryColor}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={tenantSettings.secondaryColor}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, secondaryColor: e.target.value })}
                      placeholder="#f97316"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Informazioni di Contatto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <div className="flex gap-2">
                  <Mail className="w-5 h-5 text-muted-foreground mt-2" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={tenantSettings.contactEmail}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, contactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefono</Label>
                <div className="flex gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground mt-2" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={tenantSettings.contactPhone}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <div className="flex gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-2" />
                  <Textarea
                    id="address"
                    rows={2}
                    value={tenantSettings.address}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, address: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="flex gap-2">
                  <Facebook className="w-5 h-5 text-blue-600 mt-2" />
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/..."
                    value={tenantSettings.socialFacebook}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, socialFacebook: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex gap-2">
                  <Instagram className="w-5 h-5 text-pink-600 mt-2" />
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/..."
                    value={tenantSettings.socialInstagram}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, socialInstagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <div className="flex gap-2">
                  <Twitter className="w-5 h-5 text-blue-400 mt-2" />
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/..."
                    value={tenantSettings.socialTwitter}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, socialTwitter: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => updateTenantMutation.mutate(tenantSettings)}
              disabled={updateTenantMutation.isPending}
            >
              {updateTenantMutation.isPending ? "Salvataggio..." : "Salva Tutte le Impostazioni"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

