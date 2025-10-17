import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Eye,
  MessageSquare,
  Package,
  Briefcase,
  FileQuestion,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ModerationDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [moderationNote, setModerationNote] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const statsQuery = trpc.moderation.getStats.useQuery();
  const queueQuery = trpc.moderation.getQueue.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    itemType: typeFilter !== "all" ? typeFilter : undefined,
  });

  // Mutations
  const approveMutation = trpc.moderation.approve.useMutation({
    onSuccess: () => {
      toast.success("Elemento approvato con successo");
      utils.moderation.getQueue.invalidate();
      utils.moderation.getStats.invalidate();
      setShowApproveDialog(false);
      setSelectedItem(null);
      setModerationNote("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const rejectMutation = trpc.moderation.reject.useMutation({
    onSuccess: () => {
      toast.success("Elemento rifiutato");
      utils.moderation.getQueue.invalidate();
      utils.moderation.getStats.invalidate();
      setShowRejectDialog(false);
      setSelectedItem(null);
      setModerationNote("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const stats = statsQuery.data;
  const queue = queueQuery.data || [];

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case "marketplace":
        return <Package className="w-4 h-4" />;
      case "professional_profile":
        return <Briefcase className="w-4 h-4" />;
      case "forum_thread":
      case "forum_post":
        return <MessageSquare className="w-4 h-4" />;
      case "tutorial_request":
        return <FileQuestion className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "marketplace":
        return "Marketplace";
      case "professional_profile":
        return "Profilo Professionale";
      case "forum_thread":
        return "Thread Forum";
      case "forum_post":
        return "Post Forum";
      case "tutorial_request":
        return "Richiesta Tutorial";
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Bassa";
      default:
        return priority;
    }
  };

  const handleApprove = (item: any) => {
    setSelectedItem(item);
    setShowApproveDialog(true);
  };

  const handleReject = (item: any) => {
    setSelectedItem(item);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (!selectedItem) return;
    approveMutation.mutate({
      queueItemId: selectedItem.id,
      note: moderationNote || undefined,
    });
  };

  const confirmReject = () => {
    if (!selectedItem) return;
    if (!moderationNote.trim()) {
      toast.error("Devi fornire una motivazione per il rifiuto");
      return;
    }
    rejectMutation.mutate({
      queueItemId: selectedItem.id,
      note: moderationNote,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Elementi da moderare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Priorità</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.highPriority || 0}</div>
            <p className="text-xs text-muted-foreground">
              Richiede attenzione immediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Tipo</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats?.byType?.map((item: any) => (
                <div key={item.itemType} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{getItemTypeLabel(item.itemType)}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stato</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="in_review">In Revisione</SelectItem>
                  <SelectItem value="approved">Approvati</SelectItem>
                  <SelectItem value="rejected">Rifiutati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="professional_profile">Profili Professionali</SelectItem>
                  <SelectItem value="forum_thread">Thread Forum</SelectItem>
                  <SelectItem value="forum_post">Post Forum</SelectItem>
                  <SelectItem value="tutorial_request">Richieste Tutorial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Coda di Moderazione</CardTitle>
          <CardDescription>
            {queue.length} elementi trovati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento...
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun elemento da moderare
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getItemTypeIcon(item.itemType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{item.itemTitle}</h4>
                          <Badge variant={getPriorityColor(item.priority) as any}>
                            {getPriorityLabel(item.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {getItemTypeLabel(item.itemType)}
                          </Badge>
                        </div>
                        {item.itemContent && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.itemContent}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{item.itemCreatorName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString('it-IT')}</span>
                          </div>
                          {item.reportCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {item.reportCount} segnalazioni
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(item)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approva
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rifiuta
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approva Elemento</DialogTitle>
            <DialogDescription>
              Confermi di voler approvare "{selectedItem?.itemTitle}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-note">Note (opzionale)</Label>
              <Textarea
                id="approve-note"
                placeholder="Aggiungi eventuali note..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setModerationNote("");
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approvazione..." : "Conferma Approvazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Elemento</DialogTitle>
            <DialogDescription>
              Fornisci una motivazione per il rifiuto di "{selectedItem?.itemTitle}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-note">Motivazione *</Label>
              <Textarea
                id="reject-note"
                placeholder="Spiega perché questo elemento viene rifiutato..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setModerationNote("");
              }}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !moderationNote.trim()}
            >
              {rejectMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

