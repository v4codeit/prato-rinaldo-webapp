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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/molecules/image-upload';
import {
  updateTenantBranding,
  updateTenantLimits,
  updateTenantModules,
  toggleMaintenanceMode,
} from '@/app/actions/tenant-settings';
import { toast } from 'sonner';
import { Building, HardDrive, Package, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  // Branding
  logo: z.string().url('Inserisci un URL valido').or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore hex valido'),

  // Resource Limits
  max_users: z.number().min(1, 'Minimo 1 utente'),
  max_storage_mb: z.number().min(100, 'Minimo 100 MB'),

  // Enabled Modules
  enabled_modules: z.array(z.string()),

  // Maintenance Mode
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().optional(),
});

interface TenantSettingsFormProps {
  initialValues: z.infer<typeof formSchema>;
}

// Available modules configuration
const AVAILABLE_MODULES = [
  { id: 'marketplace', label: 'Marketplace', description: 'Compravendita tra membri' },
  { id: 'events', label: 'Eventi', description: 'Gestione eventi e calendario' },
  { id: 'bacheca', label: 'Bacheca Privata', description: 'Bacheca riservata ai membri' },
  { id: 'agora', label: 'Agorà', description: 'Proposte e votazioni' },
  { id: 'resources', label: 'Risorse', description: 'Documenti e tutorial' },
  { id: 'community_pro', label: 'Community Pro', description: 'Professionisti e volontari' },
];

export function TenantSettingsForm({ initialValues }: TenantSettingsFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  async function onSubmitBranding() {
    const values = form.getValues();

    const { success, error } = await updateTenantBranding({
      logo: values.logo,
      primary_color: values.primary_color,
      secondary_color: values.secondary_color,
      accent_color: values.accent_color,
    });

    if (error) {
      toast.error('Errore durante il salvataggio del branding');
    } else {
      toast.success('Branding aggiornato con successo');
      router.refresh();
    }
  }

  async function onSubmitLimits() {
    const values = form.getValues();

    const { success, error } = await updateTenantLimits({
      max_users: values.max_users,
      max_storage_mb: values.max_storage_mb,
    });

    if (error) {
      toast.error('Errore durante il salvataggio dei limiti');
    } else {
      toast.success('Limiti risorsa aggiornati con successo');
      router.refresh();
    }
  }

  async function onSubmitModules() {
    const values = form.getValues();

    const { success, error } = await updateTenantModules(values.enabled_modules);

    if (error) {
      toast.error('Errore durante il salvataggio dei moduli');
    } else {
      toast.success('Moduli aggiornati con successo');
      router.refresh();
    }
  }

  async function onSubmitMaintenance() {
    const values = form.getValues();

    const { success, error } = await toggleMaintenanceMode(
      values.maintenance_mode,
      values.maintenance_message
    );

    if (error) {
      toast.error('Errore durante il salvataggio della modalità manutenzione');
    } else {
      toast.success(
        values.maintenance_mode
          ? 'Modalità manutenzione attivata'
          : 'Modalità manutenzione disattivata'
      );
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Section 1: Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <CardTitle>Branding Tenant</CardTitle>
            </div>
            <CardDescription>
              Personalizza logo e colori specifici per questo tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Tenant</FormLabel>
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
                    Logo specifico per questo tenant (sovrascrive il logo generale)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Primario</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Secondario</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accent_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore Accent</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onSubmitBranding}
                disabled={form.formState.isSubmitting}
              >
                Salva Branding
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Resource Limits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              <CardTitle>Limiti Risorse</CardTitle>
            </div>
            <CardDescription>
              Configura i limiti di utilizzo per questo tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_users"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Massimo Utenti</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Numero massimo di utenti registrati
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_storage_mb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Massimo Storage (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={100}
                        step={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Limite di storage in megabyte (1000 MB = 1 GB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onSubmitLimits}
                disabled={form.formState.isSubmitting}
              >
                Salva Limiti
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Enabled Modules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Moduli Abilitati</CardTitle>
            </div>
            <CardDescription>
              Seleziona quali moduli sono attivi per questo tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enabled_modules"
              render={() => (
                <FormItem>
                  <div className="space-y-3">
                    {AVAILABLE_MODULES.map((module) => (
                      <FormField
                        key={module.id}
                        control={form.control}
                        name="enabled_modules"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={module.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(module.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, module.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== module.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">{module.label}</FormLabel>
                                <FormDescription>{module.description}</FormDescription>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onSubmitModules}
                disabled={form.formState.isSubmitting}
              >
                Salva Moduli
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Maintenance Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Modalità Manutenzione</CardTitle>
            </div>
            <CardDescription>
              Metti il tenant in modalità manutenzione temporaneamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="maintenance_mode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Abilita Modalità Manutenzione</FormLabel>
                    <FormDescription>
                      Il sito mostrerà un messaggio di manutenzione agli utenti
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('maintenance_mode') && (
              <FormField
                control={form.control}
                name="maintenance_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Messaggio di Manutenzione</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Il sito è temporaneamente in manutenzione. Torneremo presto!"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Messaggio visualizzato agli utenti durante la manutenzione
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onSubmitMaintenance}
                disabled={form.formState.isSubmitting}
                variant={form.watch('maintenance_mode') ? 'destructive' : 'default'}
              >
                {form.watch('maintenance_mode') ? 'Disabilita Manutenzione' : 'Abilita Manutenzione'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
