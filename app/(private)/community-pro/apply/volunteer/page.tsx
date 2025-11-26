'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { TagsInput } from '@/components/molecules/tags-input';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { createServiceProfile } from '@/app/actions/service-profiles';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Info, Heart, AlertCircle } from 'lucide-react';
import { Alert as AlertUI, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function ApplyVolunteerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [nameWarning, setNameWarning] = useState<string>('');

  // Form field states for persistence
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [availabilityHours, setAvailabilityHours] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  // Get user profile data for pre-filling
  useEffect(() => {
    async function getUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch complete user profile from users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Validate name length
          if (!profile.name || profile.name.length < 2) {
            setNameWarning('Il tuo nome profilo deve contenere almeno 2 caratteri. Aggiornalo prima di candidarti.');
            setUserData(null);
          } else {
            setUserData({ id: profile.id, name: profile.name, email: profile.email, phone: profile.phone });
            setUserId(profile.id);
            // Pre-fill contact fields from user profile
            setContactPhone(profile.phone || '');
            setContactEmail(profile.email || '');
          }
        }
      }
    }
    getUserData();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    // Inject businessName from userData (disabled field not included in FormData)
    if (userData?.name) {
      formData.set('businessName', userData.name);
    }

    // Validate services
    if (services.length === 0) {
      setError('Inserisci almeno un servizio');
      setLoading(false);
      return;
    }

    // Validate contact info
    const phone = formData.get('contactPhone') as string;
    const email = formData.get('contactEmail') as string;
    if (!phone && !email) {
      setError('Inserisci almeno un metodo di contatto (telefono o email)');
      setLoading(false);
      return;
    }

    // Add services and certifications as JSON arrays
    formData.set('services', JSON.stringify(services));
    formData.set('certifications', JSON.stringify(certifications));
    formData.set('profileType', 'volunteer'); // Hardcoded for volunteers

    // Add portfolio images if present
    if (portfolioImages.length > 0) {
      formData.set('portfolioImages', JSON.stringify(portfolioImages));
    }

    const result = await createServiceProfile(formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Candidatura inviata con successo! Riceverai una notifica quando sarà approvata.');
      router.push('/bacheca?tab=overview');
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header con back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/community-pro">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna a Community Pro
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">
              Candidati come Volontario
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Offri il tuo aiuto gratuitamente alla community di Prato Rinaldo
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm font-medium">Processo di Candidatura</p>
            <p className="text-sm text-muted-foreground mt-1">
              La tua candidatura verrà inviata in moderazione e riceverai una email quando sarà approvata.
              Come volontario, offri i tuoi servizi gratuitamente o con solo rimborso spese.
            </p>
          </div>
        </Alert>

        {/* Name Validation Warning */}
        {nameWarning && (
          <AlertUI variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profilo Incompleto</AlertTitle>
            <AlertDescription>
              {nameWarning}{' '}
              <Link href="/settings" className="underline font-medium">
                Vai alle Impostazioni
              </Link>
            </AlertDescription>
          </AlertUI>
        )}

        <Card>
          <form action={handleSubmit}>
            <CardHeader>
              <CardTitle>Informazioni Volontariato</CardTitle>
              <CardDescription>
                Compila i dettagli del tuo profilo. Tutti i campi contrassegnati con * sono obbligatori.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Business Name - Pre-filled from user profile */}
              <div className="space-y-2">
                <FormField
                  label="Nome Completo o Nome Gruppo"
                  name="businessName"
                  type="text"
                  required
                  disabled
                  value={userData?.name || ''}
                  placeholder="Caricamento..."
                />
                <p className="text-xs text-muted-foreground">
                  Nome ereditato dal tuo profilo utente. Per modificarlo, aggiorna il tuo profilo nelle{' '}
                  <Link href="/settings" className="underline">
                    impostazioni
                  </Link>
                  .
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleziona una categoria...</option>
                  <option value="aiuto_anziani">Aiuto Anziani</option>
                  <option value="supporto_bambini">Supporto Bambini</option>
                  <option value="manutenzione">Manutenzione e Riparazioni</option>
                  <option value="giardinaggio">Giardinaggio</option>
                  <option value="informatica">Informatica e Tecnologia</option>
                  <option value="trasporti">Trasporti e Accompagnamento</option>
                  <option value="eventi">Organizzazione Eventi</option>
                  <option value="cucina">Cucina e Catering</option>
                  <option value="insegnamento">Insegnamento e Tutoraggio</option>
                  <option value="altro">Altro</option>
                </select>
              </div>

              {/* Services */}
              <TagsInput
                label="Servizi Offerti"
                name="services"
                value={services}
                onChange={setServices}
                placeholder="Es: Spesa per anziani (premi Invio)"
                maxTags={10}
                required
                helperText="Separa i servizi premendo Invio o virgola. Sii specifico per aiutare gli utenti a trovarti."
              />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrizione <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={50}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descrivi cosa puoi fare per aiutare la community, la tua esperienza e la tua motivazione..."
                />
                <p className="text-sm text-muted-foreground">
                  Almeno 50 caratteri. Spiega come vuoi aiutare e quali competenze puoi mettere a disposizione.
                </p>
              </div>

              {/* Availability Hours */}
              <div className="space-y-2">
                <FormField
                  label="Disponibilità Oraria Settimanale"
                  name="availabilityHours"
                  type="number"
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(e.target.value)}
                  placeholder="Es: 5"
                />
                <p className="text-sm text-muted-foreground">
                  Quante ore a settimana puoi dedicare al volontariato? (opzionale)
                </p>
              </div>

              {/* Certifications */}
              <TagsInput
                label="Competenze e Qualifiche"
                name="certifications"
                value={certifications}
                onChange={setCertifications}
                placeholder="Es: Primo Soccorso (premi Invio)"
                maxTags={10}
                required={false}
                helperText="Opzionale - Elenca competenze, certificazioni o esperienze rilevanti."
              />

              {/* Contact Info - Pre-filled from user profile */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Informazioni di Contatto</h3>
                <p className="text-sm text-muted-foreground -mt-2">
                  Inserisci almeno un metodo di contatto (telefono o email). Campi pre-compilati dal tuo profilo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Telefono"
                    name="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+39 xxx xxx xxxx"
                  />
                  <FormField
                    label="Email"
                    name="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                  />
                </div>
              </div>

              {/* Address - Optional for volunteers */}
              <div className="space-y-2">
                <FormField
                  label="Indirizzo (opzionale)"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Via Roma 123, San Cesareo"
                />
                <p className="text-sm text-muted-foreground">
                  Indica la tua zona per aiutare chi cerca volontari vicino a te.
                </p>
              </div>

              {/* Portfolio Images */}
              <div className="space-y-2">
                <Label>Foto Esperienze Precedenti (opzionale)</Label>
                <MultiImageUpload
                  bucket="service-portfolio"
                  currentImages={portfolioImages}
                  onImagesChange={setPortfolioImages}
                  maxImages={6}
                  maxSizeMB={10}
                  userId={userId}
                />
                <p className="text-sm text-muted-foreground">
                  Carica fino a 6 foto di esperienze passate o attività di volontariato. Max 10MB per foto.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full sm:w-auto sm:flex-1"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto sm:flex-1"
                disabled={loading || !!nameWarning}
              >
                {loading ? 'Invio in corso...' : 'Invia Candidatura'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
