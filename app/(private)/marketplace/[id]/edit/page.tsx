import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getItemById } from '@/app/actions/marketplace';
import { getCategories } from '@/app/actions/categories';
import { MarketplaceEditForm } from './marketplace-edit-form';

/**
 * Marketplace Edit Page - Owner only
 *
 * Features:
 * - Loads existing marketplace item data
 * - Pre-populates all form fields including images
 * - Validates seller ownership
 * - Updates item on submission
 * - Redirects to item detail on success
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item } = await getItemById(id);

  if (!item) {
    return {
      title: 'Annuncio non trovato',
    };
  }

  return {
    title: `Modifica ${item.title}`,
    description: `Modifica l'annuncio: ${item.title}`,
  };
}

export default async function MarketplaceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get current user and check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/marketplace/${id}/edit`);
  }

  // Get marketplace item data
  const { item } = await getItemById(id);

  if (!item) {
    notFound();
  }

  // Check ownership - only seller can edit
  if (item.seller_id !== user.id) {
    // Not authorized - redirect to item detail with error
    redirect(`/marketplace/${id}?error=unauthorized`);
  }

  // Get categories for dropdown
  const { categories } = await getCategories('marketplace_item');

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modifica Annuncio</h1>
        <p className="text-muted-foreground">
          Aggiorna i dettagli del tuo annuncio. Tutti i campi sono obbligatori tranne quelli indicati come opzionali.
        </p>
      </div>

      {/* Type assertion safe here - item is validated to exist above */}
      <MarketplaceEditForm item={item as any} categories={categories} />
    </div>
  );
}
