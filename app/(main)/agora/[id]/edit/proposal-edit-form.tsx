'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, AlertTriangle, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { updateProposal, deleteProposal } from '@/app/actions/proposals';
import { getProposalAttachments } from '@/app/actions/storage';
import { getProposalTags } from '@/app/actions/proposal-tags';
import { createProposalSchema } from '@/lib/utils/validators';
import { ROUTES } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { ProposalAttachmentUpload } from '@/components/molecules/proposal-attachment-upload';
import { ProposalTagSelector } from '@/components/molecules/proposal-tag-selector';
import type { Proposal, ProposalCategory } from '@/app/actions/proposals';
import type { ProposalTag } from '@/types/proposals';

interface ProposalEditFormProps {
  proposal: Proposal;
  categories: ProposalCategory[];
}

// Form data type
type ProposalFormData = {
  title: string;
  description: string;
  categoryId: string;
};

// Attachment type
interface Attachment {
  id: string;
  url: string;
  file_name: string;
  file_type: string;
}

/**
 * ProposalEditForm Component
 *
 * Client-side form for editing proposals with:
 * - Pre-populated fields from existing proposal data
 * - Real-time validation using Zod
 * - Optimistic updates with loading states
 * - Error handling with user feedback
 * - Delete functionality with confirmation
 * - Attachment upload/management
 */
export function ProposalEditForm({ proposal, categories }: ProposalEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  const [availableTags, setAvailableTags] = useState<ProposalTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    proposal.tags?.map(t => t.id) || []
  );
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Initialize form with existing proposal data
  const form = useForm<ProposalFormData>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      title: proposal.title,
      description: proposal.description,
      categoryId: proposal.category_id,
    },
  });

  // Load attachments and tags on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [attachmentsResult, tagsResult] = await Promise.all([
          getProposalAttachments(proposal.id),
          getProposalTags(),
        ]);

        if (attachmentsResult.attachments) {
          const mappedAttachments: Attachment[] = attachmentsResult.attachments.map((att: any) => ({
            id: att.id,
            url: att.url,
            file_name: att.file_name,
            file_type: att.file_type,
          }));
          setAttachments(mappedAttachments);
        }

        setAvailableTags(tagsResult.tags);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Errore nel caricamento dei dati');
      } finally {
        setIsLoadingAttachments(false);
        setIsLoadingTags(false);
      }
    }
    loadData();
  }, [proposal.id]);

  /**
   * Handle form submission
   * Note: Attachments are already persisted in DB, no need to pass them
   */
  const onSubmit = (data: ProposalFormData) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('categoryId', data.categoryId);
      formData.append('tagIds', JSON.stringify(selectedTagIds));

      const result = await updateProposal(proposal.id, formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Proposta aggiornata con successo!');
        router.push(`${ROUTES.AGORA}/${proposal.id}`);
        router.refresh();
      }
    });
  };

  /**
   * Handle proposal deletion
   */
  const handleDelete = () => {
    setIsDeleting(true);

    startTransition(async () => {
      const result = await deleteProposal(proposal.id);

      if (result.error) {
        toast.error(result.error);
        setIsDeleting(false);
      } else {
        toast.success('Proposta eliminata con successo');
        router.push(ROUTES.AGORA);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dettagli Proposta</CardTitle>
          <CardDescription>
            Modifica il titolo, la descrizione e la categoria della tua proposta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Es: Nuova area giochi per bambini"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Un titolo chiaro e conciso (10-200 caratteri)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Field */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona una categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Scegli la categoria più adatta alla tua proposta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Field (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-slate-400" />
                  <label className="text-sm font-medium">Tag (opzionale)</label>
                </div>
                {isLoadingTags ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <ProposalTagSelector
                    availableTags={availableTags}
                    selectedTagIds={selectedTagIds}
                    onChange={setSelectedTagIds}
                    disabled={isPending}
                    maxTags={3}
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Aggiungi fino a 3 tag per classificare la tua proposta
                </p>
              </div>

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrivi in dettaglio la tua proposta, i benefici per la comunità, e come potrebbe essere realizzata..."
                        className="min-h-[200px]"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Descrizione dettagliata (50-2000 caratteri). Spiega perché questa proposta è importante.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachments Section */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">Allegati (opzionale)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aggiungi immagini o documenti PDF a supporto della tua proposta
                  </p>
                </div>

                {isLoadingAttachments ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Skeleton className="aspect-square" />
                      <Skeleton className="aspect-square" />
                    </div>
                  </div>
                ) : (
                  <ProposalAttachmentUpload
                    proposalId={proposal.id}
                    currentAttachments={attachments}
                    onAttachmentsChange={setAttachments}
                    maxFiles={5}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isPending || isDeleting}
                  className="flex-1 sm:flex-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salva Modifiche
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending || isDeleting}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Annulla
                </Button>

                {/* Delete Button with Confirmation */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isPending || isDeleting}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Conferma Eliminazione
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler eliminare questa proposta? Questa azione non può essere annullata.
                        Tutti i commenti e i voti associati verranno eliminati.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Eliminazione...
                          </>
                        ) : (
                          'Elimina Proposta'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informazioni Importanti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Puoi modificare la tua proposta solo finché è in stato "Proposta"
          </p>
          <p>
            • Una volta che la proposta entra in revisione, non sarà più modificabile
          </p>
          <p>
            • I voti e i commenti rimarranno invariati dopo le modifiche
          </p>
          <p>
            • L'eliminazione è irreversibile e rimuoverà anche tutti i commenti e i voti
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
