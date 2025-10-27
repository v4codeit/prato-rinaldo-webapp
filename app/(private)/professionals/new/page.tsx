'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { createServiceProfile } from '@/app/actions/service-profiles';
import { ROUTES } from '@/lib/utils/constants';

export default function NewProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const result = await createServiceProfile(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/community-pro?success=created');
    }
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Crea Profilo Professionale</h1>
          <p className="text-muted-foreground">
            Presenta i tuoi servizi professionali alla community
          </p>
        </div>

        <Card>
          <form action={handleSubmit}>
            <CardHeader>
              <CardTitle>Informazioni Professionali</CardTitle>
              <CardDescription>
                Compila i dettagli del tuo profilo professionale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              <FormField
                label="Nome Attività"
                name="businessName"
                type="text"
                required
                placeholder="Es: Studio Legale Rossi"
              />

              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleziona...</option>
                  <option value="avvocato">Avvocato</option>
                  <option value="commercialista">Commercialista</option>
                  <option value="medico">Medico</option>
                  <option value="dentista">Dentista</option>
                  <option value="architetto">Architetto</option>
                  <option value="geometra">Geometra</option>
                  <option value="elettricista">Elettricista</option>
                  <option value="idraulico">Idraulico</option>
                  <option value="imbianchino">Imbianchino</option>
                  <option value="giardiniere">Giardiniere</option>
                  <option value="fotografo">Fotografo</option>
                  <option value="parrucchiere">Parrucchiere/Estetista</option>
                  <option value="altro">Altro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrizione <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="Descrivi i tuoi servizi e la tua esperienza..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Telefono"
                  name="contactPhone"
                  type="tel"
                  required
                  placeholder="+39 xxx xxx xxxx"
                />
                <FormField
                  label="Email"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="nome@esempio.com"
                />
              </div>

              <FormField
                label="Sito Web"
                name="website"
                type="url"
                placeholder="https://www.esempio.com"
              />

              <FormField
                label="Indirizzo"
                name="address"
                type="text"
                placeholder="Via Roma 123, San Cesareo"
              />

              <Alert>
                <p className="text-sm">
                  <strong>Nota:</strong> Il tuo profilo professionale verrà inviato in moderazione
                  prima di essere pubblicato. Riceverai una notifica quando sarà approvato.
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
                {loading ? 'Creazione...' : 'Crea Profilo'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
