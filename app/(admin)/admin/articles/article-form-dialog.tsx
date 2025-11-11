'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, Wand2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { RichTextEditor } from '@/components/organisms/editor/rich-text-editor';

import { createArticle, updateArticle } from '@/app/actions/articles';
import { uploadArticleImage } from '@/app/actions/storage';
import { generateSlug } from '@/lib/utils/slug';

// Form validation schema
const articleFormSchema = z.object({
  title: z.string().min(5, 'Il titolo deve avere almeno 5 caratteri').max(200),
  slug: z.string().min(3, 'Lo slug deve avere almeno 3 caratteri').max(200),
  excerpt: z.string().min(20, 'Il sommario deve avere almeno 20 caratteri').max(500),
  content: z.string().min(100, 'Il contenuto deve avere almeno 100 caratteri'),
  coverImage: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    status: 'draft' | 'published' | 'archived';
  } | null;
  onSuccess?: () => void;
}

const AUTOSAVE_KEY = 'article-form-draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export function ArticleFormDialog({
  open,
  onOpenChange,
  article,
  onSuccess,
}: ArticleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const isEditMode = !!article?.id;

  // Initialize form
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: article?.title || '',
      slug: article?.slug || '',
      excerpt: article?.excerpt || '',
      content: article?.content || '<p>Inizia a scrivere il tuo articolo...</p>',
      coverImage: article?.cover_image || '',
      status: article?.status || 'draft',
    },
  });

  // Load auto-saved draft from localStorage (only for create mode)
  React.useEffect(() => {
    if (!isEditMode && open) {
      try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          const hasContent = draft.title || draft.excerpt || draft.content !== '<p>Inizia a scrivere il tuo articolo...</p>';

          if (hasContent) {
            const shouldRestore = window.confirm(
              'È stata trovata una bozza salvata automaticamente. Vuoi ripristinarla?'
            );

            if (shouldRestore) {
              form.reset(draft);
              toast.success('Bozza ripristinata');
            } else {
              localStorage.removeItem(AUTOSAVE_KEY);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load autosaved draft:', error);
      }
    }
  }, [isEditMode, open, form]);

  // Auto-save to localStorage (only for create mode)
  React.useEffect(() => {
    if (!isEditMode && open) {
      const subscription = form.watch((values) => {
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(values));
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to autosave:', error);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [isEditMode, open, form]);

  // Reset form when article changes (for edit mode)
  React.useEffect(() => {
    if (article && open) {
      // Edit mode: populate with article data
      form.reset({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        coverImage: article.cover_image || '',
        status: article.status,
      });
    } else if (!article && open) {
      // Create mode: clear form
      form.reset({
        title: '',
        slug: '',
        excerpt: '',
        content: '<p>Inizia a scrivere il tuo articolo...</p>',
        coverImage: '',
        status: 'draft',
      });
    }
  }, [article, open, form]);

  // Clear autosave on successful submit
  const clearAutosave = React.useCallback(() => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear autosave:', error);
    }
  }, []);

  // Handle cover image upload
  const handleCoverImageUpload = React.useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Il file deve essere inferiore a 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato non supportato. Usa JPEG, PNG, WebP o SVG');
      return;
    }

    setIsUploadingCover(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadArticleImage(formData);

    if (result.error) {
      toast.error(result.error);
    } else if (result.url) {
      form.setValue('coverImage', result.url);
      toast.success('Immagine caricata con successo');
    }

    setIsUploadingCover(false);
  }, [form]);

  // Generate slug from title
  const handleGenerateSlug = React.useCallback(async () => {
    const title = form.getValues('title');

    if (!title || title.length < 5) {
      toast.error('Inserisci prima un titolo valido (almeno 5 caratteri)');
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
      toast.success('Slug generato');
    } catch (error) {
      toast.error('Errore nella generazione dello slug');
    } finally {
      setIsGeneratingSlug(false);
    }
  }, [form]);

  // Submit handler
  const onSubmit = React.useCallback(async (values: ArticleFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('slug', values.slug);
    formData.append('excerpt', values.excerpt);
    formData.append('content', values.content);
    // Only append coverImage if it has a value (avoid empty string validation error)
    if (values.coverImage) {
      formData.append('coverImage', values.coverImage);
    }
    formData.append('status', values.status);

    const result = isEditMode
      ? await updateArticle(article.id, formData)
      : await createArticle(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        isEditMode
          ? 'Articolo aggiornato con successo'
          : 'Articolo creato con successo'
      );
      clearAutosave();
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    }

    setIsSubmitting(false);
  }, [isEditMode, article, form, clearAutosave, onOpenChange, onSuccess]);

  // Handle dialog close
  const handleDialogClose = React.useCallback((open: boolean) => {
    if (!open && !isEditMode) {
      const hasChanges = form.formState.isDirty;

      if (hasChanges) {
        const shouldClose = window.confirm(
          'Hai modifiche non salvate. La bozza sarà salvata automaticamente. Vuoi chiudere?'
        );

        if (!shouldClose) {
          return;
        }
      }
    }

    onOpenChange(open);
  }, [isEditMode, form, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica i dettagli dell\'articolo'
              : 'Crea un nuovo articolo per la piattaforma'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Titolo dell'articolo..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Il titolo principale dell'articolo (5-200 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug URL *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="articolo-slug"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateSlug}
                      disabled={isSubmitting || isGeneratingSlug}
                      title="Genera slug dal titolo"
                    >
                      {isGeneratingSlug ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    URL-friendly slug (generato automaticamente dal titolo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Excerpt */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sommario *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrizione dell'articolo..."
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve sommario dell'articolo (20-500 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immagine di copertina</FormLabel>
                  <div className="space-y-4">
                    {field.value && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={field.value}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => form.setValue('coverImage', '')}
                        >
                          Rimuovi
                        </Button>
                      </div>
                    )}
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={handleCoverImageUpload}
                          disabled={isSubmitting || isUploadingCover}
                          className="flex-1"
                        />
                        {isUploadingCover && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </FormControl>
                  </div>
                  <FormDescription>
                    Immagine principale dell'articolo (max 5MB, JPEG/PNG/WebP/SVG)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content (Rich Text Editor) */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenuto *</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Scrivi il contenuto dell'articolo..."
                      editable={!isSubmitting}
                      minHeight="500px"
                    />
                  </FormControl>
                  <FormDescription>
                    Contenuto completo dell'articolo con formattazione rich text (min 100 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona lo stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="published">Pubblicato</SelectItem>
                      <SelectItem value="archived">Archiviato</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Lo stato di pubblicazione dell'articolo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-save indicator */}
            {!isEditMode && lastSaved && (
              <div className="text-xs text-muted-foreground">
                Ultimo salvataggio automatico: {lastSaved.toLocaleTimeString('it-IT')}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Aggiornamento...' : 'Creazione...'}
                  </>
                ) : (
                  <>{isEditMode ? 'Aggiorna Articolo' : 'Crea Articolo'}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
