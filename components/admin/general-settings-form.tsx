'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/molecules/image-upload';
import { updateMultipleSettings } from '@/app/actions/site-settings';
import { toast } from 'sonner';
import { Globe, Palette, Search, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  // Basic Site Info
  site_name: z.string().min(1, 'Il nome del sito è obbligatorio'),
  site_description: z.string().optional(),
  site_logo: z.string().url('Inserisci un URL valido').or(z.literal('')),
  site_favicon: z.string().url('Inserisci un URL valido').or(z.literal('')),

  // Theme Colors
  theme_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),
  theme_secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),
  theme_accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),

  // SEO Settings
  seo_title: z.string().optional(),
  seo_description: z.string().max(160, 'Massimo 160 caratteri').optional(),
  seo_keywords: z.string().optional(),

  // Contact Information
  contact_email: z.string().email('Inserisci un\'email valida').or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
});

interface GeneralSettingsFormProps {
  initialValues: z.infer<typeof formSchema>;
}

export function GeneralSettingsForm({ initialValues }: GeneralSettingsFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert form values to site_settings format (snake_case keys)
    const updates: Record<string, string> = {
      site_name: values.site_name,
      site_description: values.site_description || '',
      site_logo: values.site_logo,
      site_favicon: values.site_favicon,
      theme_primary_color: values.theme_primary_color,
      theme_secondary_color: values.theme_secondary_color,
      theme_accent_color: values.theme_accent_color,
      seo_title: values.seo_title || '',
      seo_description: values.seo_description || '',
      seo_keywords: values.seo_keywords || '',
      contact_email: values.contact_email,
      contact_phone: values.contact_phone || '',
      contact_address: values.contact_address || '',
    };

    const { error } = await updateMultipleSettings(updates);

    if (error) {
      toast.error('Errore durante il salvataggio');
    } else {
      toast.success('Impostazioni generali salvate con successo');
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Site Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Informazioni Base</CardTitle>
            </div>
            <CardDescription>
              Configura nome, descrizione, logo e favicon del sito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="site_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Sito *</FormLabel>
                  <FormControl>
                    <Input placeholder="Il mio sito" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome principale del sito (es. "Comitato Prato Rinaldo")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Una breve descrizione del sito..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descrizione del sito (visualizzata in alcune sezioni)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Sito</FormLabel>
                  <FormControl>
                    <ImageUpload
                      bucket="logos"
                      currentImage={field.value || null}
                      onImageChange={(url) => field.onChange(url || '')}
                      maxSizeMB={2}
                      acceptSVG={true}
                    />
                  </FormControl>
                  <FormDescription>
                    Logo principale del sito (visualizzato nel header)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormControl>
                    <ImageUpload
                      bucket="logos"
                      currentImage={field.value || null}
                      onImageChange={(url) => field.onChange(url || '')}
                      maxSizeMB={1}
                      acceptSVG={true}
                    />
                  </FormControl>
                  <FormDescription>
                    Icona visualizzata nella tab del browser (32x32px o 16x16px)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Theme Colors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Colori Tema</CardTitle>
            </div>
            <CardDescription>
              Personalizza i colori del tema del sito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="theme_primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Primario *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="w-20 h-10" {...field} />
                      </FormControl>
                      <Input
                        type="text"
                        placeholder="#0891b2"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <FormDescription>
                      Colore principale del tema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="theme_secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Secondario *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="w-20 h-10" {...field} />
                      </FormControl>
                      <Input
                        type="text"
                        placeholder="#f97316"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <FormDescription>
                      Colore secondario del tema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="theme_accent_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Accent *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="w-20 h-10" {...field} />
                      </FormControl>
                      <Input
                        type="text"
                        placeholder="#8b5cf6"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <FormDescription>
                      Colore accent per evidenziazioni
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Color Preview */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-3">Anteprima Colori</p>
              <div className="flex gap-3">
                <div
                  className="h-16 w-full rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                  style={{ backgroundColor: form.watch('theme_primary_color') }}
                >
                  Primario
                </div>
                <div
                  className="h-16 w-full rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                  style={{ backgroundColor: form.watch('theme_secondary_color') }}
                >
                  Secondario
                </div>
                <div
                  className="h-16 w-full rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                  style={{ backgroundColor: form.watch('theme_accent_color') }}
                >
                  Accent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: SEO Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <CardTitle>SEO Settings</CardTitle>
            </div>
            <CardDescription>
              Ottimizza il sito per i motori di ricerca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="seo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo SEO</FormLabel>
                  <FormControl>
                    <Input placeholder="Il mio sito - Tagline breve" {...field} />
                  </FormControl>
                  <FormDescription>
                    Titolo visualizzato nei risultati di ricerca (meta title)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione SEO</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrizione del sito per i motori di ricerca..."
                      className="resize-none"
                      rows={3}
                      maxLength={160}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Descrizione per i motori di ricerca (max 160 caratteri) - {field.value?.length || 0}/160
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords SEO</FormLabel>
                  <FormControl>
                    <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                  </FormControl>
                  <FormDescription>
                    Parole chiave separate da virgola (es: "comitato, quartiere, eventi")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 4: Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <CardTitle>Informazioni di Contatto</CardTitle>
            </div>
            <CardDescription>
              Dati di contatto pubblici del sito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email di Contatto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="info@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email pubblica per contatti
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono di Contatto</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+39 123 456 7890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Numero di telefono pubblico
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Via Roma 123, 00100 Roma RM"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Indirizzo fisico (se applicabile)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvataggio...' : 'Salva Tutte le Impostazioni'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
