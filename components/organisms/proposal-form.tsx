'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema } from '@/lib/utils/validators';
import { createProposal, getProposalCategories, type ProposalCategory } from '@/app/actions/proposals';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

type ProposalFormData = z.infer<typeof createProposalSchema>;

export function ProposalForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<ProposalCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const { categories: fetchedCategories } = await getProposalCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error('Errore nel caricamento delle categorie');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
    },
  });

  const onSubmit = (data: ProposalFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('categoryId', data.categoryId);

      const result = await createProposal(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.proposalId) {
        // Redirect to edit page to add attachments
        toast.success('Proposta creata! Ora puoi aggiungere allegati (opzionale).');
        router.push(`/agora/${result.proposalId}/edit`);
      } else {
        toast.success('Proposta creata con successo! Sarà visibile dopo la revisione.');
        router.push('/agora');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo della Proposta *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Es: Installare rastrelliere per bici in piazza"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Scegli un titolo chiaro e descrittivo (10-200 caratteri)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending || isLoadingCategories}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCategories ? "Caricamento..." : "Seleziona una categoria"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Scegli la categoria più appropriata per la tua proposta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione Completa *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrivi la tua proposta in dettaglio: cosa vorresti realizzare, perché è importante per la comunità, quali benefici porterebbe..."
                  rows={10}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Spiega perché questa proposta è importante per la comunità (minimo 50 caratteri, massimo 2000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={isPending || isLoadingCategories}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creazione in corso...
              </>
            ) : (
              'Crea Proposta'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
