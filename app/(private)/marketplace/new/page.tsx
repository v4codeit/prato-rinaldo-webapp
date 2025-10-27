'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { createMarketplaceItem } from '@/app/actions/marketplace';
import { getCategories, type Category } from '@/app/actions/categories';
import { ROUTES } from '@/lib/utils/constants';

export default function NewMarketplaceItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const { categories: fetchedCategories } = await getCategories('marketplace_item');
      setCategories(fetchedCategories);
    }
    loadCategories();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const result = await createMarketplaceItem(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/marketplace?success=created');
    }
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pubblica Annuncio</h1>
          <p className="text-muted-foreground">
            Vendi qualcosa nella community. Una percentuale andrà al comitato!
          </p>
        </div>

        <Card>
          <form action={handleSubmit}>
            <CardHeader>
              <CardTitle>Dettagli Annuncio</CardTitle>
              <CardDescription>
                Compila i dettagli del tuo annuncio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              <FormField
                label="Titolo"
                name="title"
                type="text"
                required
                placeholder="Es: Bicicletta da corsa"
              />

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrizione <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="Descrivi il tuo articolo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Prezzo (€)"
                  name="price"
                  type="number"
                  required
                  placeholder="0.00"
                />

                <div className="space-y-2">
                  <Label htmlFor="categoryId">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
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

              <div className="space-y-2">
                <Label htmlFor="condition">
                  Condizione <span className="text-destructive">*</span>
                </Label>
                <select
                  id="condition"
                  name="condition"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleziona...</option>
                  <option value="new">Nuovo</option>
                  <option value="like_new">Come Nuovo</option>
                  <option value="good">Buono</option>
                  <option value="fair">Discreto</option>
                  <option value="poor">Da Sistemare</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isPrivate">
                  Visibilità <span className="text-destructive">*</span>
                </Label>
                <select
                  id="isPrivate"
                  name="isPrivate"
                  required
                  defaultValue="false"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="false">Pubblico - Visibile a tutti</option>
                  <option value="true">Privato - Solo Residenti Verificati</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Gli annunci privati sono visibili solo agli utenti residenti verificati dalla community
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="committeePercentage">
                  Percentuale per il Comitato (%)
                </Label>
                <input
                  type="number"
                  id="committeePercentage"
                  name="committeePercentage"
                  min="0"
                  max="100"
                  defaultValue="10"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Una percentuale del prezzo di vendita andrà al comitato per sostenere le attività
                </p>
              </div>

              <Alert>
                <p className="text-sm">
                  <strong>Nota:</strong> Il tuo annuncio verrà inviato in moderazione prima di essere
                  pubblicato. Riceverai una notifica quando sarà approvato.
                </p>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Pubblicazione...' : 'Pubblica Annuncio'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
