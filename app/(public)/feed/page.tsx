import { createClient } from '@/lib/supabase/server';
import { getPublicFeed } from '@/app/actions/feed';
import { FeedClient } from './feed-client';
import { FeedFilters } from '@/components/feed/feed-filters';
import { JoinCommunityBanner } from '@/components/feed/join-community-banner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Bacheca Pubblica',
  description: 'Le ultime novità dalla community di Prato Rinaldo',
};

interface FeedPageProps {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parse search params
  const params = await searchParams;
  const currentPage = parseInt(params.page ?? '1');
  const filterType = (params.type ?? 'all') as 'all' | 'event' | 'marketplace' | 'proposal';
  const sortBy = (params.sort ?? 'newest') as 'newest' | 'popular';

  // Fetch feed data
  const { feedItems, hasMore, total } = await getPublicFeed({
    type: filterType,
    sortBy,
    limit: 20,
    offset: (currentPage - 1) * 20,
  });

  return (
    <div className="container py-8">
      {/* Banner CTA (solo utenti non registrati) */}
      {!user && <JoinCommunityBanner variant="desktop" />}

      {/* 3-Column Layout: Filters | Feed | Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Filters (Desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-32">
            <FeedFilters
              activeFilter={filterType}
              sortBy={sortBy}
              variant="default"
            />
          </div>
        </aside>

        {/* Center: Feed */}
        <main className="lg:col-span-6">
          {/* Mobile Filters */}
          <div className="lg:hidden mb-4">
            <FeedFilters
              activeFilter={filterType}
              sortBy={sortBy}
              variant="compact"
            />
          </div>

          {/* Feed Items */}
          {feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nessun contenuto disponibile al momento.
              </p>
            </div>
          ) : (
            <FeedClient feedItems={feedItems} />
          )}

          {/* Pagination */}
          {feedItems.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, total)} di {total} contenuti
              </div>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/feed?type=${filterType}&sort=${sortBy}&page=${currentPage - 1}`}>
                      Precedente
                    </Link>
                  </Button>
                )}
                {hasMore && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/feed?type=${filterType}&sort=${sortBy}&page=${currentPage + 1}`}>
                      Successivo
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Placeholder per future ads/widgets (Desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-32">
            {/* TODO: Aggiungere ads e widgets */}
            <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
              Spazio riservato per pubblicità e widgets
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Banner CTA (solo utenti non registrati) */}
      {!user && <JoinCommunityBanner variant="mobile" />}
    </div>
  );
}
