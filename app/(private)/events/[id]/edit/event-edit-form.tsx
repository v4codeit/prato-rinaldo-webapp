'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Save } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { updateEvent } from '@/app/actions/events';
import { createEventSchema } from '@/lib/utils/validators';
import type { Category } from '@/app/actions/categories';

/**
 * Event type from getEventById
 * All fields are potentially undefined from the database query
 */
interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  cover_image: string | null;
  start_date: string;
  end_date: string | null;
  is_private: boolean;
  max_attendees: number | null;
  requires_payment: boolean;
  price: number;
  status: string;
  organizer_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  organizer?: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
  rsvp_count?: number;
}

interface EventEditFormProps {
  event: Event;
  categories: Category[];
}

// Form data type - explicit type for form fields
// We need to make boolean and number fields required for react-hook-form
type EventFormData = {
  title: string;
  description: string;
  location: string;
  categoryId: string;
  coverImage?: string;
  startDate: string;
  endDate?: string;
  isPrivate: boolean;
  maxAttendees?: number;
  requiresPayment: boolean;
  price: number;
};

// Custom schema for edit form - no default values on boolean/number fields
const editEventSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500),
  description: z.string().min(20, 'La descrizione deve contenere almeno 20 caratteri'),
  location: z.string().min(3, 'La località è obbligatoria'),
  categoryId: z.string().uuid('Categoria non valida'),
  coverImage: z.string().url('URL immagine non valido').optional(),
  startDate: z.string().datetime('Data inizio non valida'),
  endDate: z.string().datetime('Data fine non valida').optional(),
  isPrivate: z.boolean(),
  maxAttendees: z.number().int().min(1).optional(),
  requiresPayment: z.boolean(),
  price: z.number().int().min(0),
});

/**
 * Convert ISO datetime string to datetime-local format
 * @param isoString - ISO 8601 datetime string
 * @returns datetime-local formatted string (YYYY-MM-DDTHH:mm)
 */
function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * EventEditForm Component
 *
 * Client-side form for editing events with:
 * - Pre-populated fields from existing event data
 * - Real-time validation using Zod
 * - Optimistic updates with loading states
 * - Error handling with user feedback
 * - Accessibility features (ARIA labels, keyboard navigation)
 *
 * @param event - Existing event data to edit
 * @param categories - Available event categories
 */
export function EventEditForm({ event, categories }: EventEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing event data
  const form = useForm<EventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      location: event.location,
      categoryId: event.category?.id || categories[0]?.id || '',
      coverImage: event.cover_image || undefined,
      startDate: formatDateTimeLocal(event.start_date),
      endDate: event.end_date ? formatDateTimeLocal(event.end_date) : undefined,
      isPrivate: event.is_private ?? false,
      maxAttendees: event.max_attendees || undefined,
      requiresPayment: event.requires_payment ?? false,
      price: event.price ?? 0,
    },
  });

  // Watch requiresPayment to conditionally show price field
  const requiresPayment = form.watch('requiresPayment');

  /**
   * Handle form submission
   * - Validates data
   * - Calls updateEvent server action
   * - Redirects to event detail on success
   * - Shows error message on failure
   */
  async function onSubmit(values: EventFormData) {
    setError(null);

    startTransition(async () => {
      try {
        // Convert datetime-local values to ISO strings for server
        const startDateISO = new Date(values.startDate).toISOString();
        const endDateISO = values.endDate ? new Date(values.endDate).toISOString() : null;

        // Create FormData for server action
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('location', values.location);
        formData.append('categoryId', values.categoryId);
        if (values.coverImage) {
          formData.append('coverImage', values.coverImage);
        }
        formData.append('startDate', startDateISO);
        if (endDateISO) {
          formData.append('endDate', endDateISO);
        }
        formData.append('isPrivate', values.isPrivate.toString());
        if (values.maxAttendees) {
          formData.append('maxAttendees', values.maxAttendees.toString());
        }
        formData.append('requiresPayment', values.requiresPayment.toString());
        formData.append('price', values.price.toString());

        const result = await updateEvent(event.id, formData);

        if (result.error) {
          setError(result.error);
          return;
        }

        // Success - redirect to event detail
        router.push(`/events/${event.id}`);
        router.refresh();
      } catch (err) {
        setError('Si è verificato un errore imprevisto. Riprova.');
        console.error('Error updating event:', err);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Base</CardTitle>
            <CardDescription>
              Dettagli principali dell'evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="es. Assemblea Condominiale Ordinaria"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Il titolo principale dell'evento (minimo 5 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi i dettagli dell'evento, l'ordine del giorno, o altre informazioni importanti..."
                      className="min-h-[150px] resize-y"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Una descrizione dettagliata dell'evento (minimo 20 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
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
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La categoria dell'evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date and Location */}
        <Card>
          <CardHeader>
            <CardTitle>Data e Luogo</CardTitle>
            <CardDescription>
              Quando e dove si svolge l'evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luogo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="es. Sala Comune, Via Roma 1"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Dove si terrà l'evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Ora Inizio *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isPending}
                        className="pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Quando inizia l'evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Ora Fine (opzionale)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value || ''}
                        disabled={isPending}
                        className="pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Quando termina l'evento (opzionale)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Immagine di Copertina</CardTitle>
            <CardDescription>
              Aggiungi un'immagine per rendere l'evento più accattivante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Immagine (opzionale)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://esempio.com/immagine.jpg"
                      {...field}
                      value={field.value || ''}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Link a un'immagine di copertina per l'evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni</CardTitle>
            <CardDescription>
              Configura le opzioni dell'evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Private Event */}
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Evento Privato
                    </FormLabel>
                    <FormDescription>
                      Solo i residenti verificati possono vedere e partecipare
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      aria-label="Evento privato"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Max Attendees */}
            <FormField
              control={form.control}
              name="maxAttendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero Massimo Partecipanti (opzionale)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="es. 50"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Limita il numero di persone che possono partecipare
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requires Payment */}
            <FormField
              control={form.control}
              name="requiresPayment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Richiede Pagamento
                    </FormLabel>
                    <FormDescription>
                      L'evento richiede un contributo economico
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      aria-label="Richiede pagamento"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Price (conditional) */}
            {requiresPayment && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prezzo (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="es. 10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Importo richiesto per la partecipazione (in euro)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            asChild
            disabled={isPending}
          >
            <Link href={`/events/${event.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Annulla
            </Link>
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
