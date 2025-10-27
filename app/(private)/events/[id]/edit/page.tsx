import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/app/actions/events';
import { getCategories } from '@/app/actions/categories';
import { EventEditForm } from './event-edit-form';

/**
 * Event Edit Page - Board members only
 *
 * Features:
 * - Loads existing event data
 * - Pre-populates all form fields
 * - Validates board member access
 * - Updates event on submission
 * - Redirects to event detail on success
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await getEventById(id);

  if (!event) {
    return {
      title: 'Evento non trovato',
    };
  }

  return {
    title: `Modifica ${event.title}`,
    description: `Modifica l'evento: ${event.title}`,
  };
}

export default async function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get current user and check permissions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/edit`);
  }

  // Check if user is a board member
  const { data: profile } = await supabase
    .from('users')
    .select('committee_role')
    .eq('id', user.id)
    .single() as { data: { committee_role: string | null } | null };

  if (!profile?.committee_role) {
    redirect(`/events/${id}`); // Not authorized, redirect to event detail
  }

  // Get event data
  const { event } = await getEventById(id);

  if (!event) {
    notFound();
  }

  // Get categories for dropdown
  const { categories } = await getCategories('event');

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modifica Evento</h1>
        <p className="text-muted-foreground">
          Aggiorna i dettagli dell'evento. Tutti i campi sono obbligatori tranne quelli indicati come opzionali.
        </p>
      </div>

      {/* Type assertion safe here - event is validated to exist above */}
      <EventEditForm event={event as any} categories={categories} />
    </div>
  );
}
