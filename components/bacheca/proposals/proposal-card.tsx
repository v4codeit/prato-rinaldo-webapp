'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  Calendar
} from 'lucide-react';
import { ProposalWithActions } from '@/types/bacheca';
import { deleteProposal } from '@/app/actions/proposals';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  proposal: ProposalWithActions;
  onDelete?: () => void;
  variant?: 'mobile' | 'desktop';
}

/**
 * Status badge styling helper
 */
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    proposed: { label: 'Proposta', variant: 'secondary' },
    under_review: { label: 'In Revisione', variant: 'default' },
    approved: { label: 'Approvata', variant: 'default' },
    declined: { label: 'Rifiutata', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

/**
 * Check if user can edit the proposal (only status='proposed')
 */
const canEdit = (status: string) => status === 'proposed';

/**
 * Check if user can delete the proposal (status in ['proposed', 'declined'])
 */
const canDelete = (status: string) => ['proposed', 'declined'].includes(status);

export function ProposalCard({ proposal, onDelete, variant = 'mobile' }: ProposalCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProposal(proposal.id);
    setIsDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Proposta eliminata con successo');
    setShowDeleteDialog(false);
    onDelete?.();
  };

  const handleEdit = () => {
    router.push(`/agora/${proposal.id}/edit`);
  };

  const handleView = () => {
    router.push(`/agora/${proposal.id}`);
  };

  // Format date
  const createdDate = new Date(proposal.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (variant === 'mobile') {
    return (
      <>
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-3">
            {/* Header: Category + Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {proposal.category?.icon && (
                  <span
                    className="text-lg flex-shrink-0"
                    style={{ color: proposal.category.color || '#0891b2' }}
                    aria-label={proposal.category.name}
                  >
                    {proposal.category.icon}
                  </span>
                )}
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: proposal.category?.color || '#0891b2' }}
                >
                  {proposal.category?.name}
                </span>
              </div>
              {getStatusBadge(proposal.status)}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base line-clamp-2 leading-snug">
              {proposal.title}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1" title="Supporti">
                <ThumbsUp className="h-3.5 w-3.5 text-violet-600" />
                <span className="font-medium text-violet-600">{proposal.upvotes} supporti</span>
              </div>
              <div className="flex items-center gap-1" title="Data creazione">
                <Calendar className="h-3.5 w-3.5" />
                <span>{createdDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                className="flex-1"
                aria-label="Visualizza proposta"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Visualizza
              </Button>
              {canEdit(proposal.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  aria-label="Modifica proposta"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete(proposal.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Elimina proposta"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conferma eliminazione</DialogTitle>
              <DialogDescription>
                Sei sicuro di voler eliminare questa proposta? Questa azione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Annulla
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminazione...' : 'Elimina'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop variant - Table row style
  return (
    <>
      <div className="group border-b hover:bg-muted/50 transition-colors">
        <div className="p-4 grid grid-cols-12 gap-4 items-center">
          {/* Category Icon + Title */}
          <div className="col-span-5 flex items-center gap-3 min-w-0">
            {proposal.category?.icon && (
              <span
                className="text-xl flex-shrink-0"
                style={{ color: proposal.category.color || '#0891b2' }}
                aria-label={proposal.category.name}
              >
                {proposal.category.icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm line-clamp-1">
                {proposal.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {proposal.category?.name}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="col-span-2">
            {getStatusBadge(proposal.status)}
          </div>

          {/* Supporti */}
          <div className="col-span-2 flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5 text-violet-600" />
            <span className="text-sm font-medium text-violet-600">{proposal.upvotes} supporti</span>
          </div>

          {/* Date */}
          <div className="col-span-2 text-sm text-muted-foreground">
            {createdDate}
          </div>

          {/* Actions */}
          <div className="col-span-1 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              aria-label="Visualizza proposta"
              title="Visualizza"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit(proposal.status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                aria-label="Modifica proposta"
                title="Modifica"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete(proposal.status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Elimina proposta"
                title="Elimina"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questa proposta? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
