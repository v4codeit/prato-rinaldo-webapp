import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const updateMutation = trpc.auth.updateProfile.useMutation();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  if (loading) {
    return <div className="container py-8">Caricamento...</div>;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Profilo aggiornato con successo!");
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del profilo");
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Il Tuo Profilo</CardTitle>
          <CardDescription>Gestisci le informazioni del tuo account</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">L'email non può essere modificata</p>
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
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

