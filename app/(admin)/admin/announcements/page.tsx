import { Suspense } from 'react';
import { AnnouncementsContent } from './announcements-content';
import { AnnouncementsSkeleton } from './announcements-skeleton';

export const metadata = {
  title: 'Gestione Annunci - Admin',
  description: 'Gestisci banner e annunci del mobile menu',
};

export default function AnnouncementsAdminPage() {
  return (
    <Suspense fallback={<AnnouncementsSkeleton />}>
      <AnnouncementsContent />
    </Suspense>
  );
}
