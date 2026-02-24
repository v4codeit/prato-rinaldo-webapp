import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect, notFound } from 'next/navigation';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { getMercatinoItemById } from '@/app/actions/mercatino';
import { MercatinoWizard } from '@/components/mercatino/wizard';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Modifica Annuncio | Mercatino',
  description: 'Modifica il tuo annuncio sul Mercatino di Prato Rinaldo',
};

// Loading skeleton
function WizardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <div className="w-10" />
          </div>
          <Skeleton className="h-1 w-full" />
          <div className="flex justify-between py-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64 mb-6" />
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Content component with auth check
async function EditMercatinoContent({ id }: { id: string }) {
  await connection();

  // Require verified resident status
  let user;
  try {
    user = await requireVerifiedResident();
  } catch {
    redirect(ROUTES.LOGIN);
  }

  // Get the item to edit
  const result = await getMercatinoItemById(id);

  if (!result.item) {
    notFound();
  }

  const { item } = result;

  // Cast to access properties
  const marketplaceItem = item as any;

  // Check ownership
  if (marketplaceItem.seller_id !== user.id) {
    // Not the owner - redirect to detail page
    redirect(`${ROUTES.MERCATINO}/${id}`);
  }

  // Convert database format (snake_case) to wizard format (camelCase)
  const initialData = {
    step1: {
      listingType: marketplaceItem.listing_type || 'objects',
      // Include subtype if applicable
      ...(marketplaceItem.listing_type === 'real_estate'
        ? { realEstateType: marketplaceItem.real_estate_type || 'apartment_sale' }
        : { objectType: marketplaceItem.object_type || 'sale' }),
    },
    step2: marketplaceItem.listing_type === 'real_estate'
      ? {
          listingType: 'real_estate' as const,
          title: marketplaceItem.title,
          description: marketplaceItem.description || '',
          realEstateType: marketplaceItem.real_estate_type || 'apartment_sale',
          price: marketplaceItem.price,
          squareMeters: marketplaceItem.square_meters,
          rooms: marketplaceItem.rooms,
          floor: marketplaceItem.floor,
          hasElevator: marketplaceItem.has_elevator || false,
          hasGarage: marketplaceItem.has_garage || false,
          constructionYear: marketplaceItem.construction_year,
          addressZone: marketplaceItem.address_zone || '',
          categoryId: marketplaceItem.category_id,
          isPrivate: marketplaceItem.is_private || false,
        }
      : {
          listingType: 'objects' as const,
          title: marketplaceItem.title,
          description: marketplaceItem.description || '',
          objectType: marketplaceItem.object_type || 'sale',
          price: marketplaceItem.price,
          condition: marketplaceItem.condition || 'good',
          categoryId: marketplaceItem.category_id,
          isPrivate: marketplaceItem.is_private || false,
        },
    step3: {
      images: marketplaceItem.images || [],
    },
    step4: {
      contactMethods: marketplaceItem.contact_methods || [],
    },
    step5: {
      wantsToDonate: (marketplaceItem.donation_amount_cents || 0) > 0,
      donationAmountCents: marketplaceItem.donation_amount_cents || 0,
      agreeToTerms: true, // Already accepted if item exists
    },
  };

  return <MercatinoWizard itemId={id} initialData={initialData} />;
}

export default async function EditMercatinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<WizardSkeleton />}>
      <EditMercatinoContent id={id} />
    </Suspense>
  );
}
