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
import { ROUTES } from '@/lib/utils/constants';

export default function NewProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [profileType, setProfileType] = useState<'volunteer' | 'professional'>('professional');
  const [userId, setUserId] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  // Get user ID for upload paths
  useEffect(() => {
    async function getUserId() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

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
    formData.set('profileType', profileType);

    // Add logo and portfolio images if present
    if (logoUrl) {
      formData.set('logoUrl', logoUrl);
    }
    if (portfolioImages.length > 0) {
      formData.set('portfolioImages', JSON.stringify(portfolioImages));
    }

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
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Profile Type */}
              <div className="space-y-2">
                <Label htmlFor="profileType">
                  Tipo Profilo <span className="text-destructive">*</span>
                </Label>
                <select
                  id="profileType"
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as 'volunteer' | 'professional')}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  <option value="professional">Professionista (servizio a pagamento)</option>
                  <option value="volunteer">Volontario (servizio gratuito o rimborso spese)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  I volontari offrono servizi gratuitamente o con rimborso spese.
                  I professionisti forniscono servizi a pagamento.
                </p>
              </div>

              {/* Business Name */}
              <FormField
                label="Nome Attività o Nome Completo"
                name="businessName"
                type="text"
                required
                placeholder="Es: Studio Legale Rossi o Mario Rossi"
              />

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
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

              {/* Services */}
              <TagsInput
                label="Servizi Offerti"
                name="services"
                value={services}
                onChange={setServices}
                placeholder="Es: Consulenza legale (premi Invio)"
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
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
                  placeholder="Descrivi i tuoi servizi, la tua esperienza professionale e cosa ti distingue..."
                />
                <p className="text-sm text-muted-foreground">
                  Almeno 50 caratteri. Includi informazioni sulla tua esperienza, specializzazioni e cosa offri.
                </p>
              </div>

              {/* Certifications */}
              <TagsInput
                label="Certificazioni e Qualifiche"
                name="certifications"
                value={certifications}
                onChange={setCertifications}
                placeholder="Es: Abilitazione Ordine Avvocati (premi Invio)"
                maxTags={10}
                required={false}
                helperText="Opzionale - Elenca certificazioni, abilitazioni o qualifiche professionali."
              />

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Informazioni di Contatto</h3>
                <p className="text-sm text-muted-foreground -mt-2">
                  Inserisci almeno un metodo di contatto (telefono o email)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Telefono"
                    name="contactPhone"
                    type="tel"
                    placeholder="+39 xxx xxx xxxx"
                  />
                  <FormField
                    label="Email"
                    name="contactEmail"
                    type="email"
                    placeholder="nome@esempio.com"
                  />
                </div>
              </div>

              {/* Website */}
              <FormField
                label="Sito Web"
                name="website"
                type="url"
                placeholder="https://www.esempio.com"
              />

              {/* Address */}
              <FormField
                label="Indirizzo"
                name="address"
                type="text"
                placeholder="Via Roma 123, San Cesareo"
              />

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo Professionale (opzionale)</Label>
                <ImageUpload
                  bucket="service-logos"
                  currentImage={logoUrl}
                  onImageChange={setLogoUrl}
                  maxSizeMB={5}
                  userId={userId}
                  acceptSVG={true}
                />
                <p className="text-sm text-muted-foreground">
                  Carica il logo della tua attività. Formato: JPEG, PNG, WebP o SVG. Max 5MB.
                </p>
              </div>

              {/* Portfolio Images */}
              <div className="space-y-2">
                <Label>Portfolio Immagini (opzionale)</Label>
                <MultiImageUpload
                  bucket="service-portfolio"
                  currentImages={portfolioImages}
                  onImagesChange={setPortfolioImages}
                  maxImages={6}
                  maxSizeMB={10}
                  userId={userId}
                />
                <p className="text-sm text-muted-foreground">
                  Carica fino a 6 foto del tuo lavoro o della tua attività. Max 10MB per foto.
                </p>
              </div>

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
