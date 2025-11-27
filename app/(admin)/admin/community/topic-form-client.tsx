'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { toast } from 'sonner';
import { createTopic, updateTopic } from '@/app/actions/topics';
import type { TopicListItem, TopicVisibility, TopicWritePermission } from '@/types/topics';
import { ROUTES } from '@/lib/utils/constants';
import { Loader2 } from 'lucide-react';
import type { Route } from 'next';

// Form schema - define inline for proper typing
const formSchema = z.object({
  name: z.string().min(3, 'Il nome deve contenere almeno 3 caratteri').max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  visibility: z.enum(['public', 'authenticated', 'verified', 'members_only']),
  writePermission: z.enum(['all_viewers', 'verified', 'members_only', 'admins_only']),
});
type FormValues = z.infer<typeof formSchema>;

// Color presets
const colorPresets = [
  { value: '#dc2626', label: 'Rosso' },
  { value: '#ea580c', label: 'Arancione' },
  { value: '#ca8a04', label: 'Giallo' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#0891b2', label: 'Ciano' },
  { value: '#2563eb', label: 'Blu' },
  { value: '#7c3aed', label: 'Viola' },
  { value: '#db2777', label: 'Rosa' },
  { value: '#64748b', label: 'Grigio' },
];

// Emoji presets
const emojiPresets = ['📢', '💬', '🎉', '📅', '🛒', '🏠', '💡', '❓', '📚', '🔔'];

interface TopicFormClientProps {
  mode: 'create' | 'edit';
  topic?: TopicListItem;
}

/**
 * Topic form for creating/editing topics
 */
export function TopicFormClient({ mode, topic }: TopicFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: topic?.name || '',
      slug: topic?.slug || '',
      description: topic?.description || '',
      icon: topic?.icon || '💬',
      color: topic?.color || '#2563eb',
      visibility: topic?.visibility || 'verified',
      writePermission: topic?.writePermission || 'verified',
    },
  });

  // Auto-generate slug from name
  const name = form.watch('name');
  React.useEffect(() => {
    if (mode === 'create' && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', slug);
    }
  }, [name, mode, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const result = await createTopic(values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Topic creato con successo');
        router.push(ROUTES.ADMIN_COMMUNITY as Route);
      } else if (topic) {
        const result = await updateTopic(topic.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Topic aggiornato con successo');
        router.push(ROUTES.ADMIN_COMMUNITY as Route);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === 'create' ? 'Nuovo Topic' : 'Modifica Topic'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'create'
            ? 'Crea un nuovo topic per la community'
            : 'Modifica le impostazioni del topic'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni base</CardTitle>
              <CardDescription>
                Nome, descrizione e aspetto del topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Annunci Generali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="es. annunci-generali"
                        {...field}
                        disabled={mode === 'edit'}
                      />
                    </FormControl>
                    <FormDescription>
                      URL del topic: /community/{field.value || 'slug'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrivi lo scopo del topic..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icona</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input placeholder="Emoji" {...field} />
                          <div className="flex flex-wrap gap-1">
                            {emojiPresets.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => form.setValue('icon', emoji)}
                                className={cn(
                                  'p-2 rounded hover:bg-accent transition-colors',
                                  field.value === emoji && 'bg-accent'
                                )}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colore</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) =>
                                form.setValue('color', e.target.value)
                              }
                              className="h-10 w-10 rounded border cursor-pointer"
                            />
                            <Input {...field} />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {colorPresets.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() =>
                                  form.setValue('color', color.value)
                                }
                                className={cn(
                                  'h-6 w-6 rounded-full border-2 transition-all',
                                  field.value === color.value
                                    ? 'border-foreground scale-110'
                                    : 'border-transparent'
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permessi</CardTitle>
              <CardDescription>
                Chi può vedere e scrivere nel topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilità</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona visibilità" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          Pubblico - Visibile a tutti
                        </SelectItem>
                        <SelectItem value="authenticated">
                          Utenti registrati - Solo login
                        </SelectItem>
                        <SelectItem value="verified">
                          Residenti verificati - Solo approvati
                        </SelectItem>
                        <SelectItem value="members_only">
                          Solo membri - Solo membri del topic
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Chi può vedere questo topic nella lista
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="writePermission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permesso scrittura</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona permesso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_viewers">
                          Tutti possono scrivere
                        </SelectItem>
                        <SelectItem value="verified">
                          Solo verificati
                        </SelectItem>
                        <SelectItem value="members_only">
                          Solo membri del topic
                        </SelectItem>
                        <SelectItem value="admins_only">
                          Solo admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Chi può inviare messaggi in questo topic
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Anteprima</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                  style={{
                    backgroundColor: `${form.watch('color')}20`,
                  }}
                >
                  {form.watch('icon') || '💬'}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {form.watch('name') || 'Nome Topic'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {form.watch('description') || 'Descrizione del topic...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'create' ? 'Crea Topic' : 'Salva Modifiche'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
