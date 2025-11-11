'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';

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
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { updateMarketplaceItem, deleteMarketplaceItem } from '@/app/actions/marketplace';
import { createMarketplaceItemSchema } from '@/lib/utils/validators';
import type { Category } from '@/app/actions/categories';

/**
 * Marketplace Item type from getItemById
 */
interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  committee_percentage: number;
  is_private: boolean;
  seller_id: string;
  tenant_id: string;
  status: string;
  is_sold: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
  };
}

interface MarketplaceEditFormProps {
  item: MarketplaceItem;
  categories: Category[];
}

// Form data type
type MarketplaceFormData = {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  condition: string;
  isPrivate: boolean;
  committeePercentage: number;
  images: string[];
};

/**
 * MarketplaceEditForm Component
 *
 * Client-side form for editing marketplace items with:
 * - Pre-populated fields from existing item data
 * - Real-time validation using Zod
 * - Multi-image upload with current images
 * - Optimistic updates with loading states
 * - Error handling with user feedback
 * - Optional delete functionality with confirmation
 */
export function MarketplaceEditForm({ item, categories }: MarketplaceEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(item.images || []);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with existing item data
  const form = useForm<MarketplaceFormData>({
    resolver: zodResolver(createMarketplaceItemSchema) as any,
    defaultValues: {
      title: item.title,
      description: item.description,
      price: item.price,
      categoryId: item.category?.id || categories[0]?.id || '',
      condition: item.condition,
      isPrivate: item.is_private ?? false,
      committeePercentage: item.committee_percentage ?? 0,
      images: item.images || [],
    },
  });

  /**
   * Handle form submission
   * - Validates data including images
   * - Calls updateMarketplaceItem server action
   * - Redirects to item detail on success
   * - Shows error message on failure
   */
  async function onSubmit(values: MarketplaceFormData) {
    setError(null);

    // Validate images
    if (images.length === 0) {
      setError('Carica almeno 1 immagine del prodotto');
      return;
    }

    if (images.length > 6) {
      setError('Massimo 6 immagini permesse');
      return;
    }

    startTransition(async () => {
      try {
        // Create FormData for server action
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('price', values.price.toString());
        formData.append('categoryId', values.categoryId);
        formData.append('condition', values.condition);
        formData.append('isPrivate', values.isPrivate.toString());
        formData.append('committeePercentage', values.committeePercentage.toString());
        formData.append('images', JSON.stringify(images));

        const result = await updateMarketplaceItem(item.id, formData);

        if (result.error) {
          setError(result.error);
          return;
        }

        // Success - redirect to item detail
        router.push(`/marketplace/${item.id}`);
        router.refresh();
      } catch (err) {
        setError('Si è verificato un errore imprevisto. Riprova.');
        console.error('Error updating marketplace item:', err);
      }
    });
  }

  /**
   * Handle item deletion
   * - Confirms deletion with user
   * - Calls deleteMarketplaceItem server action
   * - Redirects to marketplace list on success
   */
  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteMarketplaceItem(item.id);

      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }

      // Success - redirect to marketplace
      router.push('/marketplace?success=deleted');
      router.refresh();
    } catch (err) {
      setError('Errore durante l\'eliminazione dell\'annuncio');
      console.error('Error deleting marketplace item:', err);
      setIsDeleting(false);
    }
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
              Dettagli principali dell'annuncio
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
                      placeholder="es. Bicicletta da corsa"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Il titolo dell'annuncio (minimo 5 caratteri)
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
                      placeholder="Descrivi il tuo articolo in dettaglio..."
                      className="min-h-[150px] resize-y"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Una descrizione dettagliata dell'articolo (minimo 20 caratteri)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Price Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      La categoria dell'articolo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
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
                        placeholder="es. 100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Prezzo di vendita in euro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Condition */}
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condizione *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona la condizione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">Nuovo</SelectItem>
                      <SelectItem value="like_new">Come Nuovo</SelectItem>
                      <SelectItem value="good">Buono</SelectItem>
                      <SelectItem value="fair">Discreto</SelectItem>
                      <SelectItem value="poor">Da Sistemare</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Lo stato dell'articolo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Foto Prodotto</CardTitle>
            <CardDescription>
              Carica da 1 a 6 foto del prodotto. La prima immagine sarà la copertina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              bucket="marketplace-items"
              currentImages={images}
              onImagesChange={setImages}
              maxImages={6}
              maxSizeMB={10}
              userId={item.seller_id}
              itemId={item.id}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni</CardTitle>
            <CardDescription>
              Configura le opzioni dell'annuncio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Private Item */}
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Annuncio Privato
                    </FormLabel>
                    <FormDescription>
                      Solo i residenti verificati possono vedere questo annuncio
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      aria-label="Annuncio privato"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Committee Percentage */}
            <FormField
              control={form.control}
              name="committeePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentuale per il Comitato (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="es. 10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Una percentuale del prezzo di vendita andrà al comitato per sostenere le attività (0-100%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            asChild
            disabled={isPending || isDeleting}
          >
            <Link href={`/marketplace/${item.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annulla
            </Link>
          </Button>

          {/* Delete Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={isPending || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminazione...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. L'annuncio verrà eliminato definitivamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || isDeleting}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
