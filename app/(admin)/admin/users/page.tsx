import { Suspense } from 'react';
import { UsersContent } from './users-content';
import { UsersSkeleton } from './users-skeleton';

export const metadata = {
  title: 'Gestione Utenti - Admin',
  description: 'Visualizza e gestisci tutti gli utenti della piattaforma',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    role?: string;
    verification_status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent searchParams={params} />
    </Suspense>
  );
}
