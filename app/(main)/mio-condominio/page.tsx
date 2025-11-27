import { Suspense } from 'react';
import { Metadata } from 'next';
import { MioCondominioContent } from './mio-condominio-content';
import { MioCondominioSkeleton } from './mio-condominio-skeleton';

export const metadata: Metadata = {
  title: 'Mio Condominio - Community Prato Rinaldo',
  description: 'Accedi al portale Mio Condominio per gestire il tuo condominio online',
};

export default function MioCondominioPage() {
  return (
    <Suspense fallback={<MioCondominioSkeleton />}>
      <MioCondominioContent />
    </Suspense>
  );
}
