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
import { Calendar, MapPin, Users, Euro, Image, Eye, Tag, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    <div className="container py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href={ROUTES.EVENTS}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Eventi
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crea Nuovo Evento</h1>
          <p className="text-muted-foreground mt-1">Organizza un evento per la community</p>
        </div>

        {/* Form Card - Modern styling */}
        <Card className="bg-white border rounded-3xl shadow-sm">
          <form action={handleSubmit}>
            <CardHeader className="p-6 md:p-8 pb-0 md:pb-0">
              <CardTitle className="text-xl">Dettagli Evento</CardTitle>
              <CardDescription>Compila i dettagli del tuo evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {error && <Alert variant="destructive"><p className="text-sm">{error}</p></Alert>}

              {/* Titolo */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Titolo <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Es: Assemblea Condominiale"
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione <span className="text-destructive">*</span></Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Descrivi l'evento..."
                  className="flex min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>

              {/* Luogo */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Luogo <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    placeholder="Es: Sala Riunioni, Via..."
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
                  >
                    <option value="">Seleziona categoria...</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data e Ora Inizio <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      id="startDate"
                      name="startDate"
                      required
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data e Ora Fine</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label htmlFor="coverImage" className="text-sm font-medium">Immagine di Copertina (URL)</Label>
                <div className="relative">
                  <Image className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="url"
                    id="coverImage"
                    name="coverImage"
                    placeholder="https://..."
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Max Attendees & Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Numero Massimo Partecipanti</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      id="maxAttendees"
                      name="maxAttendees"
                      placeholder="Illimitato se vuoto"
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isPrivate">Visibilità</Label>
                  <div className="relative">
                    <Eye className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                    <select
                      id="isPrivate"
                      name="isPrivate"
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
                    >
                      <option value="false">Pubblico</option>
                      <option value="true">Solo Residenti Verificati</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requiresPayment"
                    name="requiresPayment"
                    className="h-5 w-5 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <Label htmlFor="requiresPayment" className="cursor-pointer font-medium">Evento a Pagamento</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      id="price"
                      name="price"
                      defaultValue="0"
                      placeholder="0.00"
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm transition-all focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </div>

              <Alert className="rounded-xl bg-teal-50 border-teal-200">
                <p className="text-sm text-teal-800"><strong>Nota:</strong> L'evento verrà pubblicato immediatamente.</p>
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
                className="flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20"
                disabled={loading}
              >
                {loading ? 'Pubblicazione...' : 'Pubblica Evento'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
