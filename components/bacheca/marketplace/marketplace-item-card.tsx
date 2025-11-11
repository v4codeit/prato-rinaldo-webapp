'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  MoreVertical,
  Package,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MarketplaceItemWithActions } from '@/types/bacheca';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface MarketplaceItemCardProps {
  item: MarketplaceItemWithActions;
  onEdit: () => void;
  onDelete: () => void;
  onMarkSold: () => void;
  variant?: 'mobile' | 'desktop';
}

export function MarketplaceItemCard({
  item,
  onEdit,
  onDelete,
  onMarkSold,
  variant = 'mobile',
}: MarketplaceItemCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);

  const handleView = () => {
    router.push(`/marketplace/${item.id}`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  const handleMarkSold = () => {
    setSoldDialogOpen(false);
    onMarkSold();
  };

  const getStatusBadge = () => {
    if (item.is_sold) {
      return <Badge variant="secondary">Venduto</Badge>;
    }

    switch (item.status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Attivo</Badge>;
      case 'pending':
        return <Badge variant="outline">In attesa</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rifiutato</Badge>;
      default:
        return null;
    }
  };

  const imageUrl = item.images && item.images.length > 0
    ? item.images[0]
    : '/placeholder-image.png';

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative aspect-video bg-muted">
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {item.is_private && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  Privato
                </Badge>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge()}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                {item.title}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>

            {/* Price and Details */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-bold text-primary">
                {item.price.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                  locale: it,
                })}
              </div>
            </div>

            {/* Condition Badge */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">
                {item.condition}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            onClick={handleView}
            variant="outline"
            size="sm"
            className="flex-1"
            aria-label={`Visualizza ${item.title}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vedi
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Altre azioni"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </DropdownMenuItem>

              {!item.is_sold && item.status === 'approved' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSoldDialogOpen(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Segna come venduto
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare &quot;{item.title}&quot;? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Sold Confirmation Dialog */}
      <Dialog open={soldDialogOpen} onOpenChange={setSoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segna come venduto</DialogTitle>
            <DialogDescription>
              Vuoi segnare &quot;{item.title}&quot; come venduto? L&apos;annuncio non sarà più visibile nel marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSoldDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button onClick={handleMarkSold}>
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
