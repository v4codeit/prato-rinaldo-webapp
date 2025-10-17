import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const { data: pendingUsers, refetch } = trpc.admin.listPendingUsers.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin'),
  });
  const approveMutation = trpc.admin.approveUser.useMutation();
  const rejectMutation = trpc.admin.rejectUser.useMutation();

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync({ userId });
      toast.success("Utente approvato con successo!");
      refetch();
    } catch (error) {
      toast.error("Errore durante l'approvazione");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectMutation.mutateAsync({ userId });
      toast.success("Utente rifiutato");
      refetch();
    } catch (error) {
      toast.error("Errore durante il rifiuto");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Pannello Amministrazione</h1>
        <p className="text-lg text-muted-foreground">Gestisci la piattaforma e gli utenti</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Utenti in Attesa di Verifica
          </h2>
          <Badge variant="secondary">{pendingUsers?.length || 0} in attesa</Badge>
        </div>

        {pendingUsers && pendingUsers.length > 0 ? (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                      {user.street && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Indirizzo: {user.street} {user.streetNumber}, {user.municipality === 'san_cesareo' ? 'San Cesareo' : 'Zagarolo'}
                        </p>
                      )}
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">
                          Telefono: {user.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(user.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nessun utente in attesa di verifica</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

