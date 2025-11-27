'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { createEvent } from '@/app/actions/events';
import { getCategories, type Category } from '@/app/actions/categories';
import { getCurrentUser } from '@/app/actions/users';
import { ROUTES } from '@/lib/utils/constants';

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Check board member + load categories
  useEffect(() => {
    async function init() {
      const { user } = await getCurrentUser();
      if (!user || !user.committee_role) {
        setAuthorized(false);
        setChecking(false);
        return;
      }
      setAuthorized(true);

      const { categories: cats } = await getCategories('event');
      setCategories(cats);
      setChecking(false);
    }
    init();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await createEvent(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/events?success=created');
    }
  }

  if (checking) return <div className="container py-12">Caricamento...</div>;
  if (!authorized) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>Solo i membri del comitato possono creare eventi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(ROUTES.EVENTS)}>Torna agli Eventi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Crea Nuovo Evento</h1>
          <p className="text-muted-foreground">Organizza un evento per la community</p>
        </div>
        <Card>
          <form action={handleSubmit}>
            <CardHeader>
              <CardTitle>Dettagli Evento</CardTitle>
              <CardDescription>Compila i dettagli del tuo evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="destructive"><p className="text-sm">{error}</p></Alert>}

              <FormField label="Titolo" name="title" type="text" required placeholder="Es: Assemblea Condominiale" />

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione <span className="text-destructive">*</span></Label>
                <textarea id="description" name="description" required className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" placeholder="Descrivi l'evento..." />
              </div>

              <FormField label="Luogo" name="location" type="text" required placeholder="Es: Sala Riunioni, Via..." />

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria <span className="text-destructive">*</span></Label>
                <select id="categoryId" name="categoryId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleziona categoria...</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data e Ora Inizio <span className="text-destructive">*</span></Label>
                  <input type="datetime-local" id="startDate" name="startDate" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data e Ora Fine</Label>
                  <input type="datetime-local" id="endDate" name="endDate" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" />
                </div>
              </div>

              <FormField label="Immagine di Copertina (URL)" name="coverImage" type="url" placeholder="https://..." />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Numero Massimo Partecipanti" name="maxAttendees" type="number" placeholder="Illimitato se vuoto" />
                <div className="space-y-2">
                  <Label htmlFor="isPrivate">Visibilità</Label>
                  <select id="isPrivate" name="isPrivate" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="false">Pubblico</option>
                    <option value="true">Solo Residenti Verificati</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="requiresPayment" name="requiresPayment" className="h-4 w-4" />
                  <Label htmlFor="requiresPayment" className="cursor-pointer">Evento a Pagamento</Label>
                </div>
                <FormField label="Prezzo (€)" name="price" type="number" defaultValue="0" placeholder="0.00" />
              </div>

              <Alert><p className="text-sm"><strong>Nota:</strong> L'evento verrà pubblicato immediatamente.</p></Alert>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="flex-1">Annulla</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Pubblicazione...' : 'Pubblica Evento'}</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
