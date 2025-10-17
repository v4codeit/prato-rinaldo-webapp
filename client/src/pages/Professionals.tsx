import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Mail, Phone, Globe, Heart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";

export default function Professionals() {
  const { user, isAuthenticated } = useAuth();
  const { data: professionals, refetch } = trpc.professionals.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: myProfile } = trpc.professionals.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const createMutation = trpc.professionals.createOrUpdate.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    isVolunteer: false,
    contactEmail: "",
    contactPhone: "",
    website: "",
  });

  if (!isAuthenticated || user?.verificationStatus !== 'approved') {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Profilo professionale salvato!");
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Errore durante il salvataggio");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Professionisti</h1>
          <p className="text-lg text-muted-foreground">Trova professionisti e volontari del quartiere</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {myProfile ? "Modifica Profilo" : "Aggiungi Profilo"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Il Tuo Profilo Professionale</DialogTitle>
              <DialogDescription>Condividi le tue competenze con la comunità</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  placeholder="es. Idraulico, Elettricista, Giardinaggio"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  placeholder="es. Idraulico professionista"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVolunteer"
                  checked={formData.isVolunteer}
                  onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isVolunteer">Offro servizi gratuiti/volontariato</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email di contatto</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefono</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sito web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {professionals && professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map(({ profile, user: profileUser }) => (
            <Card key={profile.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">{profile.category}</Badge>
                    <CardTitle>{profile.title}</CardTitle>
                    <CardDescription>{profileUser.name}</CardDescription>
                  </div>
                  {profile.isVolunteer && (
                    <Heart className="h-5 w-5 text-secondary" />
                  )}
                </div>
              </CardHeader>
              {profile.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{profile.description}</p>
                  <div className="space-y-2 text-sm">
                    {profile.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${profile.contactEmail}`} className="hover:underline">
                          {profile.contactEmail}
                        </a>
                      </div>
                    )}
                    {profile.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${profile.contactPhone}`} className="hover:underline">
                          {profile.contactPhone}
                        </a>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Sito web
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessun professionista registrato al momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

