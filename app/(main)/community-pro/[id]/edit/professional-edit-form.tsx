'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { TagsInput } from '@/components/molecules/tags-input';
import { ImageUpload } from '@/components/molecules/image-upload';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { updateProfessionalProfile } from '@/app/actions/service-profiles';
import { createProfessionalProfileSchema } from '@/lib/utils/validators';
import { createClient } from '@/lib/supabase/client';

type FormData = z.infer<typeof createProfessionalProfileSchema>;

interface Professional {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description: string;
  services: string[];
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  address: string | null;
  certifications: string[];
  logo_url: string | null;
  portfolio_images: string[];
  profile_type?: 'volunteer' | 'professional';
}

export default function ProfessionalEditForm({ professional }: { professional: Professional }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [services, setServices] = useState<string[]>(professional.services || []);
  const [certifications, setCertifications] = useState<string[]>(professional.certifications || []);
  const [profileType, setProfileType] = useState<'volunteer' | 'professional'>(
    professional.profile_type || 'professional'
  );
  const [userId, setUserId] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(professional.logo_url);
  const [portfolioImages, setPortfolioImages] = useState<string[]>(professional.portfolio_images || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createProfessionalProfileSchema) as any,
    defaultValues: {
      businessName: professional.business_name,
      category: professional.category,
      description: professional.description,
      contactPhone: professional.contact_phone || undefined,
      contactEmail: professional.contact_email || undefined,
      website: professional.website || undefined,
      address: professional.address || undefined,
    },
  });

  // Get user ID for upload paths
  useEffect(() => {
    async function getUserId() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, []);

  async function onSubmit(data: FormData) {
    setError('');

    // Validate services
    if (services.length === 0) {
      setError('Inserisci almeno un servizio');
      return;
    }

    // Validate contact info
    if (!data.contactPhone && !data.contactEmail) {
      setError('Inserisci almeno un metodo di contatto (telefono o email)');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      // Add form data
      formData.set('businessName', data.businessName);
      formData.set('category', data.category);
      formData.set('description', data.description);
      formData.set('profileType', profileType);
      formData.set('services', JSON.stringify(services));
      formData.set('certifications', JSON.stringify(certifications));

      if (data.contactPhone) formData.set('contactPhone', data.contactPhone);
      if (data.contactEmail) formData.set('contactEmail', data.contactEmail);
      if (data.website) formData.set('website', data.website);
      if (data.address) formData.set('address', data.address);

      // Add logo and portfolio images if present
      if (logoUrl) {
        formData.set('logoUrl', logoUrl);
      }
      if (portfolioImages.length > 0) {
        formData.set('portfolioImages', JSON.stringify(portfolioImages));
      }

      const result = await updateProfessionalProfile(professional.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/community-pro/${professional.id}`);
      }
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Informazioni Professionali</CardTitle>
          <CardDescription>Aggiorna i dettagli del tuo profilo professionale</CardDescription>
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
              I volontari offrono servizi gratuitamente o con rimborso spese. I professionisti forniscono
              servizi a pagamento.
            </p>
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">
              Nome Attività o Nome Completo <span className="text-destructive">*</span>
            </Label>
            <input
              id="businessName"
              type="text"
              {...register('businessName')}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Es: Studio Legale Rossi o Mario Rossi"
            />
            {errors.businessName && (
              <p className="text-sm text-destructive">{errors.businessName.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              {...register('category')}
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
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
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
              {...register('description')}
              minLength={50}
              maxLength={2000}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
              placeholder="Descrivi i tuoi servizi, la tua esperienza professionale e cosa ti distingue..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
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
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefono</Label>
                <input
                  id="contactPhone"
                  type="tel"
                  {...register('contactPhone')}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="+39 xxx xxx xxxx"
                />
                {errors.contactPhone && (
                  <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="nome@esempio.com"
                />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Sito Web</Label>
            <input
              id="website"
              type="url"
              {...register('website')}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="https://www.esempio.com"
            />
            {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo</Label>
            <input
              id="address"
              type="text"
              {...register('address')}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Via Roma 123, San Cesareo"
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

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
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
