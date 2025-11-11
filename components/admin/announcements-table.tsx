'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { deleteAnnouncement, updateAnnouncement, type Announcement } from '@/app/actions/announcements';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AnnouncementsTable({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await updateAnnouncement(id, { is_active: !currentState });

    if (error) {
      toast.error('Errore durante l\'aggiornamento');
    } else {
      toast.success(currentState ? 'Annuncio disattivato' : 'Annuncio attivato');
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    const { error } = await deleteAnnouncement(id);

    if (error) {
      toast.error('Errore durante l\'eliminazione');
    } else {
      toast.success('Annuncio eliminato');
      router.refresh();
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nessun annuncio creato. Crea il primo annuncio per iniziare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4 flex-1">
            {announcement.emoji && (
              <span className="text-2xl">{announcement.emoji}</span>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{announcement.title}</h3>
                {announcement.is_active ? (
                  <Badge variant="default">Attivo</Badge>
                ) : (
                  <Badge variant="secondary">Inattivo</Badge>
                )}
                <Badge variant="outline">P: {announcement.priority}</Badge>
              </div>
              {announcement.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {announcement.description}
                </p>
              )}
              {announcement.link && (
                <p className="text-xs text-muted-foreground mt-1">
                  Link: {announcement.link}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
            >
              {announcement.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            {/* TODO: Implementare form di modifica annunci */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(announcement.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
