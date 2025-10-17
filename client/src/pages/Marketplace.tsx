import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Euro, Heart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth();
  const { data: items, refetch } = trpc.marketplace.list.useQuery({ tenantId: "prato-rinaldo-default" });
  const createMutation = trpc.marketplace.create.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    comitteePercentage: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100),
        comitteePercentage: parseInt(formData.comitteePercentage),
      });
      toast.success("Oggetto inserito! Verrà revisionato dal comitato.");
      setDialogOpen(false);
      setFormData({ title: "", description: "", price: "", comitteePercentage: "0" });
      refetch();
    } catch (error) {
      toast.error("Errore durante l'inserimento dell'oggetto");
    }
  };

  const ItemCard = ({ item }: { item: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {item.images ? (
          <img
            src={JSON.parse(item.images)[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground">Nessuna immagine</div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 line-clamp-2">{item.title}</CardTitle>
          <Badge variant="secondary">
            <Euro className="h-3 w-3 mr-1" />
            {(item.price / 100).toFixed(2)}
          </Badge>
        </div>
        {item.description && (
          <CardDescription className="line-clamp-3">{item.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {item.comitteePercentage > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Heart className="h-4 w-4 text-secondary" />
            <span>{item.comitteePercentage}% al comitato</span>
          </div>
        )}
        <Button variant="default" className="w-full">
          Contatta il venditore
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-lg text-muted-foreground">
            Compra e vendi oggetti usati nella comunità
          </p>
        </div>
        {isAuthenticated && user?.verificationStatus === 'approved' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Vendi un oggetto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Vendi un oggetto</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli dell'oggetto che vuoi vendere.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
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
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comitteePercentage">Percentuale al comitato (%)</Label>
                  <Input
                    id="comitteePercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.comitteePercentage}
                    onChange={(e) => setFormData({ ...formData, comitteePercentage: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Puoi donare una percentuale del ricavato al comitato (opzionale)
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Invio..." : "Pubblica"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessun oggetto in vendita al momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
