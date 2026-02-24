import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { MercatinoWizard } from '@/components/mercatino/wizard';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Nuovo Annuncio | Mercatino',
  description: 'Pubblica un nuovo annuncio sul Mercatino di Prato Rinaldo',
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
async function NewMercatinoContent() {
  await connection();

  // Require verified resident status
  try {
    await requireVerifiedResident();
  } catch {
    // Redirect to login or verification page
    redirect(ROUTES.LOGIN);
  }

  return <MercatinoWizard />;
}

export default function NewMercatinoPage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <NewMercatinoContent />
    </Suspense>
  );
}
