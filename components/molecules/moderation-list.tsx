'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  getModerationItemById,
  approveModerationItem,
  rejectModerationItem
} from '@/app/actions/moderation';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ImageGallery } from '@/components/molecules/image-gallery';
import { getShortName, getInitials } from '@/lib/utils/format';

interface ModerationListProps {
  items: any[];
}

export function ModerationList({ items }: ModerationListProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function viewItem(itemId: string) {
    const result = await getModerationItemById(itemId);

    if (result.item) {
      setSelectedItem(result.item);
      setSelectedContent(result.content);
    }
  }

  async function handleApprove(itemId: string) {
    setProcessing(true);

    const result = await approveModerationItem(itemId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Elemento approvato');
      setSelectedItem(null);
      setSelectedContent(null);
      router.refresh(); // Refresh server component data
    }

    setProcessing(false);
  }

  async function handleReject(itemId: string) {
    if (!rejectReason.trim()) {
      toast.error('Inserisci un motivo per il rifiuto');
      return;
    }

    setProcessing(true);

    const result = await rejectModerationItem(itemId, rejectReason);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Elemento rifiutato');
      setSelectedItem(null);
      setSelectedContent(null);
      setRejectReason('');
      router.refresh(); // Refresh server component data
    }

    setProcessing(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Items List */}
      <div className="space-y-4">
        {items.map((item: any) => (
          <Card
            key={item.id}
            className={selectedItem?.id === item.id ? 'border-primary' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-base">
                      {item.item_type.replace('_', ' ')}
                    </CardTitle>
                    <Badge
                      variant={
                        item.status === 'pending'
                          ? 'secondary'
                          : item.status === 'approved'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Inviato da {item.submitter?.name}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewItem(item.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Item Detail */}
      <div className="sticky top-6">
        {!selectedItem ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Seleziona un elemento per visualizzare i dettagli
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dettagli Elemento</CardTitle>
              <CardDescription>
                {selectedItem.item_type.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Preview */}
              {selectedContent && (
                <div className="space-y-4 p-4 border rounded-lg">
                  {/* Images for marketplace items */}
                  {selectedItem.item_type === 'marketplace' && selectedContent.images && selectedContent.images.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Immagini Prodotto ({selectedContent.images.length})
                      </h3>
                      <ImageGallery
                        images={selectedContent.images}
                        alt={selectedContent.title || 'Prodotto marketplace'}
                      />
                    </div>
                  )}

                  {selectedContent.title && (
                    <div>
                      <p className="text-sm font-medium">Titolo</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContent.title}
                      </p>
                    </div>
                  )}
                  {selectedContent.description && (
                    <div>
                      <p className="text-sm font-medium">Descrizione</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {selectedContent.description}
                      </p>
                    </div>
                  )}
                  {selectedContent.content && (
                    <div>
                      <p className="text-sm font-medium">Contenuto</p>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {selectedContent.content}
                      </p>
                    </div>
                  )}
                  {selectedContent.price && (
                    <div>
                      <p className="text-sm font-medium">Prezzo</p>
                      <p className="text-sm text-muted-foreground">
                        €{selectedContent.price}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submitter Info */}
              <div>
                <p className="text-sm font-medium mb-2">Inviato da</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedItem.submitter?.avatar || undefined}
                      alt={selectedItem.submitter?.name || 'User'}
                    />
                    <AvatarFallback>
                      {getInitials(selectedItem.submitter?.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {getShortName(selectedItem.submitter?.name || '')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedItem.submitter?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedItem.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleApprove(selectedItem.id)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approva
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rejectReason">
                      Motivo Rifiuto
                    </Label>
                    <textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                      placeholder="Spiega il motivo del rifiuto..."
                    />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleReject(selectedItem.id)}
                      disabled={processing || !rejectReason.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rifiuta
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
