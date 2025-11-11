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
import { updateTenantSocialLinks } from '@/app/actions/tenant-settings';
import { toast } from 'sonner';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  facebook: z.string().url('Inserisci un URL valido').or(z.literal('')),
  instagram: z.string().url('Inserisci un URL valido').or(z.literal('')),
  twitter: z.string().url('Inserisci un URL valido').or(z.literal('')),
});

export function SocialSettingsForm({ initialValues }: { initialValues: z.infer<typeof formSchema> }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { success, error } = await updateTenantSocialLinks({
      social_facebook: values.facebook,
      social_instagram: values.instagram,
      social_twitter: values.twitter,
    });

    if (error) {
      toast.error('Errore durante il salvataggio');
    } else {
      toast.success('Link social salvati con successo');
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </FormLabel>
              <FormControl>
                <Input placeholder="https://facebook.com/your-page" {...field} />
              </FormControl>
              <FormDescription>
                URL completo della tua pagina Facebook
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </FormLabel>
              <FormControl>
                <Input placeholder="https://instagram.com/your-profile" {...field} />
              </FormControl>
              <FormDescription>
                URL completo del tuo profilo Instagram
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twitter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter / X
              </FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/your-profile" {...field} />
              </FormControl>
              <FormDescription>
                URL completo del tuo profilo Twitter/X
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </form>
    </Form>
  );
}
