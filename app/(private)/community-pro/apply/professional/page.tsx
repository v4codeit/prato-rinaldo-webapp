'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { TagsInput } from '@/components/molecules/tags-input';
import { ImageUpload } from '@/components/molecules/image-upload';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { createServiceProfile } from '@/app/actions/service-profiles';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Info, Briefcase, AlertCircle } from 'lucide-react';
import { Alert as AlertUI, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function ApplyProfessionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [nameWarning, setNameWarning] = useState<string>('');

  // Form field states for persistence
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
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
            setUserData(profile);
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

    // Inject representativeName from userData (disabled field not included in FormData)
    if (userData?.name) {
      formData.set('representativeName', userData.name);
    }

    // Validate logo (REQUIRED for professionals)
    if (!logoUrl) {
      setError('Il logo è obbligatorio per i professionisti');
      setLoading(false);
      return;
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

    // Validate address (REQUIRED for professionals)
    const address = formData.get('address') as string;
    if (!address || address.trim().length < 10) {
      setError('L\'indirizzo è obbligatorio e deve contenere almeno 10 caratteri');
      setLoading(false);
      return;
    }

    // Add services and certifications as JSON arrays
    formData.set('services', JSON.stringify(services));
    formData.set('certifications', JSON.stringify(certifications));
    formData.set('profileType', 'professional'); // Hardcoded for professionals
    formData.set('logoUrl', logoUrl);

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
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">
              Candidati come Professionista
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Promuovi la tua attività professionale nella community di Prato Rinaldo
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm font-medium">Processo di Candidatura</p>
            <p className="text-sm text-muted-foreground mt-1">
              La tua candidatura verrà inviata in moderazione e riceverai una email quando sarà approvata.
              Come professionista, offri servizi a pagamento alla community.
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
              <CardTitle>Informazioni Professionali</CardTitle>
              <CardDescription>
                Compila i dettagli del tuo profilo professionale. Tutti i campi contrassegnati con * sono obbligatori.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Logo - REQUIRED */}
              <div className="space-y-2">
                <Label>
                  Logo Attività <span className="text-destructive">*</span>
                </Label>
                <ImageUpload
                  bucket="service-logos"
                  currentImage={logoUrl}
                  onImageChange={setLogoUrl}
                  maxSizeMB={5}
                  userId={userId}
                />
                <p className="text-sm text-muted-foreground">
                  Il logo è obbligatorio. Max 5MB. Consigliato: formato quadrato 500x500px.
                </p>
              </div>

              {/* Business Name - Editable field for business/activity name */}
              <FormField
                label="Nome Attività"
                name="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Es: Idraulica Rossi, Studio Legale Bianchi, etc."
              />

              {/* Representative Name - Read-only, from user profile */}
              <div className="space-y-2">
                <FormField
                  label="Nome Rappresentante Legale"
                  name="representativeName"
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
                  <option value="edilizia">Edilizia e Costruzioni</option>
                  <option value="idraulica">Idraulica</option>
                  <option value="elettricista">Elettricista</option>
                  <option value="giardinaggio">Giardinaggio</option>
                  <option value="pulizie">Pulizie</option>
                  <option value="informatica">Informatica e Tecnologia</option>
                  <option value="legale">Servizi Legali</option>
                  <option value="contabilita">Contabilità e Fiscale</option>
                  <option value="salute">Salute e Benessere</option>
                  <option value="estetica">Estetica e Bellezza</option>
                  <option value="fotografia">Fotografia e Video</option>
                  <option value="ristorazione">Ristorazione e Catering</option>
                  <option value="trasporti">Trasporti e Traslochi</option>
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
                placeholder="Es: Ristrutturazioni bagni (premi Invio)"
                maxTags={10}
                required
                helperText="Separa i servizi premendo Invio o virgola. Sii specifico per aiutare i clienti a trovarti."
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
                  placeholder="Descrivi la tua attività, i tuoi servizi, la tua esperienza professionale..."
                />
                <p className="text-sm text-muted-foreground">
                  Almeno 50 caratteri. Presenta la tua attività e i punti di forza dei tuoi servizi.
                </p>
              </div>

              {/* Website - Optional */}
              <div className="space-y-2">
                <FormField
                  label="Sito Web"
                  name="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.tuosito.it"
                />
                <p className="text-sm text-muted-foreground">
                  Opzionale - Inserisci il sito web della tua attività se presente.
                </p>
              </div>

              {/* Partita IVA - Optional */}
              <div className="space-y-2">
                <FormField
                  label="Partita IVA"
                  name="vatNumber"
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="IT12345678901"
                />
                <p className="text-sm text-muted-foreground">
                  Opzionale - Formato: IT seguito da 11 cifre (es: IT12345678901)
                </p>
              </div>

              {/* Tariffa Oraria - Optional */}
              <div className="space-y-2">
                <FormField
                  label="Tariffa Oraria"
                  name="hourlyRate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Opzionale - Tariffa oraria in euro (es: 35.00 €/ora). Se non applicabile, lascia vuoto.
                </p>
              </div>

              {/* Certifications */}
              <TagsInput
                label="Certificazioni e Qualifiche"
                name="certifications"
                value={certifications}
                onChange={setCertifications}
                placeholder="Es: Certificazione ISO 9001 (premi Invio)"
                maxTags={10}
                required={false}
                helperText="Opzionale - Elenca certificazioni professionali, abilitazioni o qualifiche."
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

              {/* Address - REQUIRED for professionals */}
              <div className="space-y-2">
                <FormField
                  label="Indirizzo Sede"
                  name="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Via Roma 123, San Cesareo (RM)"
                />
                <p className="text-sm text-muted-foreground">
                  L'indirizzo della tua attività è obbligatorio (minimo 10 caratteri).
                </p>
              </div>

              {/* Portfolio Images */}
              <div className="space-y-2">
                <Label>Foto Portfolio (opzionale)</Label>
                <MultiImageUpload
                  bucket="service-portfolio"
                  currentImages={portfolioImages}
                  onImagesChange={setPortfolioImages}
                  maxImages={6}
                  maxSizeMB={10}
                  userId={userId}
                />
                <p className="text-sm text-muted-foreground">
                  Carica fino a 6 foto dei tuoi lavori o della tua attività. Max 10MB per foto.
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
