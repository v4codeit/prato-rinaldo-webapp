'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { createMarketplaceItem } from '@/app/actions/marketplace';
import { getCategories, type Category } from '@/app/actions/categories';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/utils/constants';
import { ShoppingBag, Tag, Euro, Eye, Package, Percent, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMarketplaceItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [itemId] = useState<string>(() => 'temp-' + Date.now());

  useEffect(() => {
    async function loadData() {
      // Load categories
      const { categories: fetchedCategories } = await getCategories('marketplace_item');
      setCategories(fetchedCategories);

      // Get current user ID
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(formData: FormData) {
    // Validate images
    if (images.length === 0) {
      toast.error('Carica almeno 1 immagine del prodotto');
      setError('Carica almeno 1 immagine del prodotto');
      return;
    }

    if (images.length > 6) {
      toast.error('Massimo 6 immagini permesse');
      setError('Massimo 6 immagini permesse');
      return;
    }

    setLoading(true);
    setError('');

    // Add images to form data
    formData.append('images', JSON.stringify(images));

    const result = await createMarketplaceItem(formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Annuncio creato! Sarà visibile dopo la moderazione.');
      router.push('/marketplace?success=created');
    }
  }

  return (
    <div className="container py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href={ROUTES.MARKETPLACE}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al Mercatino
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pubblica Annuncio</h1>
          <p className="text-muted-foreground mt-1">
            Vendi qualcosa nella community. Una percentuale andrà al comitato!
          </p>
        </div>

        {/* Form Card - Modern styling */}
        <Card className="bg-white border rounded-3xl shadow-sm">
          <form action={handleSubmit}>
            <CardHeader className="p-6 md:p-8 pb-0 md:pb-0">
              <CardTitle className="text-xl">Dettagli Annuncio</CardTitle>
              <CardDescription>
                Compila i dettagli del tuo annuncio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Titolo */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Titolo <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Es: Bicicletta da corsa"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrizione <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Descrivi il tuo articolo..."
                  className="flex min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Foto Prodotto <span className="text-destructive">*</span>
                </Label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <MultiImageUpload
                    bucket="marketplace-items"
                    currentImages={images}
                    onImagesChange={setImages}
                    maxImages={6}
                    maxSizeMB={10}
                    userId={userId}
                    itemId={itemId}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Carica da 1 a 6 foto del prodotto. La prima immagine sarà la copertina.
                </p>
              </div>

              {/* Prezzo e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Prezzo (€) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      placeholder="0.00"
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                    <select
                      id="categoryId"
                      name="categoryId"
                      required
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    >
                      <option value="">Seleziona...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Condizione */}
              <div className="space-y-2">
                <Label htmlFor="condition">
                  Condizione <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                  <select
                    id="condition"
                    name="condition"
                    required
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  >
                    <option value="">Seleziona...</option>
                    <option value="new">Nuovo</option>
                    <option value="like_new">Come Nuovo</option>
                    <option value="good">Buono</option>
                    <option value="fair">Discreto</option>
                    <option value="poor">Da Sistemare</option>
                  </select>
                </div>
              </div>

              {/* Visibilità */}
              <div className="space-y-2">
                <Label htmlFor="isPrivate">
                  Visibilità <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Eye className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                  <select
                    id="isPrivate"
                    name="isPrivate"
                    required
                    defaultValue="false"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  >
                    <option value="false">Pubblico - Visibile a tutti</option>
                    <option value="true">Privato - Solo Residenti Verificati</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gli annunci privati sono visibili solo agli utenti residenti verificati dalla community
                </p>
              </div>

              {/* Percentuale Comitato */}
              <div className="space-y-2">
                <Label htmlFor="committeePercentage">
                  Percentuale per il Comitato (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    id="committeePercentage"
                    name="committeePercentage"
                    min="0"
                    max="100"
                    defaultValue="10"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Una percentuale del prezzo di vendita andrà al comitato per sostenere le attività
                </p>
              </div>

              <Alert className="rounded-xl bg-emerald-50 border-emerald-200">
                <p className="text-sm text-emerald-800">
                  <strong>Nota:</strong> Il tuo annuncio verrà inviato in moderazione prima di essere
                  pubblicato. Riceverai una notifica quando sarà approvato.
                </p>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-4 p-6 md:p-8 pt-0 md:pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 h-12 rounded-xl"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                disabled={loading}
              >
                {loading ? 'Pubblicazione...' : 'Pubblica Annuncio'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
