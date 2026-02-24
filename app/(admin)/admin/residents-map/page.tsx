import { Suspense } from 'react';
import { ResidentsMapContent } from './residents-map-content';
import { ResidentsMapSkeleton } from './residents-map-skeleton';

export const metadata = {
  title: 'Mappa Residenti - Admin',
  description: 'Visualizza la distribuzione dei residenti sulla mappa',
};

export default function ResidentsMapPage() {
  return (
    <Suspense fallback={<ResidentsMapSkeleton />}>
      <ResidentsMapContent />
    </Suspense>
  );
}
