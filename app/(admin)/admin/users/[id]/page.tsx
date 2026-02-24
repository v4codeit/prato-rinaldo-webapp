import { Suspense } from 'react';
import { UserDetailContent } from './user-detail-content';
import { UserDetailSkeleton } from './user-detail-skeleton';

export const metadata = {
  title: 'Dettaglio Utente - Admin',
  description: 'Visualizza il profilo completo dell\'utente',
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<UserDetailSkeleton />}>
      <UserDetailContent userId={id} />
    </Suspense>
  );
}
