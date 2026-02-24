'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema } from '@/lib/utils/validators';
import { createProposal, getProposalCategories, type ProposalCategory } from '@/app/actions/proposals';
import { getProposalTags } from '@/app/actions/proposal-tags';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProposalTagSelector } from '@/components/molecules/proposal-tag-selector';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Loader2, Vote, Tag, FileText, Tags } from 'lucide-react';
import { z } from 'zod';
import type { ProposalTag } from '@/types/proposals';

type ProposalFormData = z.infer<typeof createProposalSchema>;

export function ProposalForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<ProposalCategory[]>([]);
  const [tags, setTags] = useState<ProposalTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Load categories and tags on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesResult, tagsResult] = await Promise.all([
          getProposalCategories(),
          getProposalTags(),
        ]);
        setCategories(categoriesResult.categories);
        setTags(tagsResult.tags);
      } catch (error) {
        toast.error('Errore nel caricamento dei dati');
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingTags(false);
      }
    }
    loadData();
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
      if (selectedTagIds.length > 0) {
        formData.append('tagIds', JSON.stringify(selectedTagIds));
      }

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
              <FormLabel className="text-sm font-medium">Titolo della Proposta *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Vote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Es: Installare rastrelliere per bici in piazza"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    {...field}
                    disabled={isPending}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
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
              <FormLabel className="text-sm font-medium">Categoria *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending || isLoadingCategories}
              >
                <FormControl>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">
                      <SelectValue placeholder={isLoadingCategories ? "Caricamento..." : "Seleziona una categoria"} />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Scegli la categoria più appropriata per la tua proposta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-slate-400" />
            <label className="text-sm font-medium">Tag (opzionale)</label>
          </div>
          <ProposalTagSelector
            availableTags={tags}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
            disabled={isPending || isLoadingTags}
            maxTags={3}
          />
          <p className="text-xs text-muted-foreground">
            Aggiungi fino a 3 tag per classificare la tua proposta
          </p>
        </div>

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Descrizione Completa *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrivi la tua proposta in dettaglio: cosa vorresti realizzare, perché è importante per la comunità, quali benefici porterebbe..."
                  rows={10}
                  className="min-h-[200px] rounded-xl border-slate-200 bg-slate-50 p-4 transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Spiega perché questa proposta è importante per la comunità (minimo 50 caratteri, massimo 2000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1 h-12 rounded-xl"
          >
            Annulla
          </Button>
          <Button
            type="submit"
            disabled={isPending || isLoadingCategories}
            className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20"
          >
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
