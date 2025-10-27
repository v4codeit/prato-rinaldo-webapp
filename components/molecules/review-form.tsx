'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createReview } from '@/app/actions/service-profiles';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ReviewForm({ professionalId }: { professionalId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);

    const result = await createReview(professionalId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Recensione inviata con successo');
      setShowForm(false);
      router.refresh(); // Refresh server component data
    }

    setSubmitting(false);
  }

  return (
    <>
      <Button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Annulla' : 'Scrivi Recensione'}
      </Button>

      {showForm && (
        <form action={handleSubmit} className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rating">Valutazione <span className="text-destructive">*</span></Label>
            <select
              id="rating"
              name="rating"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleziona...</option>
              <option value="5">⭐⭐⭐⭐⭐ Eccellente</option>
              <option value="4">⭐⭐⭐⭐ Molto Buono</option>
              <option value="3">⭐⭐⭐ Buono</option>
              <option value="2">⭐⭐ Discreto</option>
              <option value="1">⭐ Scarso</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Commento <span className="text-destructive">*</span></Label>
            <textarea
              id="comment"
              name="comment"
              required
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Descrivi la tua esperienza..."
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Invio...' : 'Invia Recensione'}
          </Button>
        </form>
      )}
    </>
  );
}
