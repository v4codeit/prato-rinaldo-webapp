import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getModerationQueue } from '@/app/actions/moderation';
import { ModerationFilters } from '@/components/molecules/moderation-filters';
import { ModerationList } from '@/components/molecules/moderation-list';
import { AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export const metadata = {
  title: 'Coda di Moderazione',
  description: 'Rivedi e approva i contenuti in attesa',
};

type ModerationStatus = 'pending' | 'approved' | 'rejected';

export default async function ModerationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.status || 'pending') as ModerationStatus;

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Coda di Moderazione</h1>
        <p className="text-muted-foreground">
          Rivedi e approva i contenuti in attesa
        </p>
      </div>

      {/* Filters - Client Component */}
      <ModerationFilters currentFilter={filter} />

      {/* Items List - Server Component with Suspense */}
      <Suspense
        key={filter}
        fallback={
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        }
      >
        <ModerationContent filter={filter} />
      </Suspense>
    </div>
  );
}

async function ModerationContent({ filter }: { filter: ModerationStatus }) {
  const result = await getModerationQueue(1, 50, { status: filter });

  if (!result.items || result.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nessun elemento da mostrare
          </p>
        </CardContent>
      </Card>
    );
  }

  return <ModerationList items={result.items} />;
}
