'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/app/actions/announcements';

interface AnnouncementsClientProps {
  announcements: Announcement[];
}

export function AnnouncementsClient({ announcements }: AnnouncementsClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = React.useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    emoji: '',
    link: '',
    priority: 1,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      emoji: '',
      link: '',
      priority: 1,
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingAnnouncement(null);
    setIsCreateOpen(false);
  };

  // Open edit dialog
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      description: announcement.description || '',
      emoji: announcement.emoji || '',
      link: announcement.link || '',
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_date: announcement.start_date || '',
      end_date: announcement.end_date || '',
    });
    setEditingAnnouncement(announcement);
  };

  // Handle submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAnnouncement) {
        // Update
        const { error } = await updateAnnouncement(editingAnnouncement.id, formData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Annuncio aggiornato');
          resetForm();
          router.refresh();
        }
      } else {
        // Create
        const { error } = await createAnnouncement(formData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Annuncio creato');
          resetForm();
          router.refresh();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await updateAnnouncement(id, { is_active: !currentState });
    if (error) {
      toast.error('Errore durante l\'aggiornamento');
    } else {
      toast.success(currentState ? 'Annuncio disattivato' : 'Annuncio attivato');
      router.refresh();
    }
  };

  // Delete announcement
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

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            Gli annunci attivi vengono mostrati nel mobile menu
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Annuncio
        </Button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nessun annuncio creato. Crea il primo annuncio per iniziare.
        </div>
      ) : (
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(announcement)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingAnnouncement}
        onOpenChange={(open) => !open && resetForm()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
              </DialogTitle>
              <DialogDescription>
                Gli annunci attivi vengono mostrati nel mobile menu in base alla priorità
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={100}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    placeholder="🎉"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorità</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) })
                    }
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link (opzionale)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Inizio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Fine</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Attivo
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Salvataggio...'
                  : editingAnnouncement
                  ? 'Aggiorna'
                  : 'Crea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
