'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Briefcase,
  User,
} from 'lucide-react';
import { ProfessionalSection } from '@/components/bacheca/professional/professional-section';
import { ProposalsSection } from '@/components/bacheca/proposals/proposals-section';
import { MarketplaceSection } from '@/components/bacheca/marketplace/marketplace-section';
import { ProfileSection } from '@/components/bacheca/profile/profile-section';
import { FeedClient } from '@/app/(main)/feed/feed-client';
import { FeedFilters } from '@/components/feed/feed-filters';
import { LevelBanner } from '@/components/molecules/level-banner';
import type {
  BachecaStats,
  PointsStats,
  BachecaTab,
  BachecaClientProps,
} from '@/types/bacheca';
import type { ProposalCategory } from '@/app/actions/proposals';
import type { Category } from '@/app/actions/categories';

export function BachecaClient({
  stats,
  marketplaceItems,
  proposals,
  proposalCategories,
  marketplaceCategories,
  professional,
  professionalStats,
  userProfile,
  badges,
  points,
  feedItems,
  feedHasMore,
  feedTotal,
}: BachecaClientProps & {
  proposalCategories: ProposalCategory[];
  marketplaceCategories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<BachecaTab>('overview');

  // Extract feed params from URL
  const feedType = (searchParams.get('type') ?? 'all') as 'all' | 'event' | 'marketplace' | 'proposal';
  const feedSort = (searchParams.get('sort') ?? 'newest') as 'newest' | 'popular';
  const feedPage = parseInt(searchParams.get('page') ?? '1');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as BachecaTab;
    if (tab && ['overview', 'marketplace', 'proposte', 'professionale', 'profilo'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as BachecaTab);
    router.push(`/bacheca?tab=${value}`, { scroll: false });
  };

  return (
    <div className="container py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Benvenuto, {userProfile.name}!
        </h1>
        <p className="text-muted-foreground">
          La tua bacheca personale per gestire tutte le tue attività
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {/* Tab List - Mobile optimized with horizontal scroll */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full md:w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Panoramica</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2 whitespace-nowrap">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
              <span className="sm:hidden">Shop</span>
              {stats.marketplace.total > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.marketplace.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proposte" className="flex items-center gap-2 whitespace-nowrap">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Proposte</span>
              <span className="sm:hidden">Agorà</span>
              {stats.proposals.total > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.proposals.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="professionale"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Profilo Pro</span>
              <span className="sm:hidden">Pro</span>
            </TabsTrigger>
            <TabsTrigger value="profilo" className="flex items-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profilo & Badge</span>
              <span className="sm:hidden">Profilo</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <LevelBanner points={points} onClick={() => handleTabChange('profilo')} />

          {/* Feed Section - 3-column layout like public feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Sidebar: Filters (Desktop only) */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32">
                <FeedFilters
                  activeFilter={feedType}
                  sortBy={feedSort}
                  variant="default"
                />
              </div>
            </aside>

            {/* Center: Feed */}
            <main className="lg:col-span-9">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-4">
                <FeedFilters
                  activeFilter={feedType}
                  sortBy={feedSort}
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
                <FeedClient feedItems={feedItems} returnTo="/bacheca?tab=overview" />
              )}

              {/* Pagination */}
              {feedItems.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((feedPage - 1) * 20) + 1} - {Math.min(feedPage * 20, feedTotal)} di {feedTotal} contenuti
                  </div>
                  <div className="flex gap-2">
                    {feedPage > 1 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/bacheca?tab=overview&type=${feedType}&sort=${feedSort}&page=${feedPage - 1}`}>
                          Precedente
                        </Link>
                      </Button>
                    )}
                    {feedHasMore && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/bacheca?tab=overview&type=${feedType}&sort=${feedSort}&page=${feedPage + 1}`}>
                          Successivo
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <MarketplaceSection
            marketplaceItems={marketplaceItems}
            categories={marketplaceCategories}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposte">
          <ProposalsSection
            proposals={proposals}
            categories={proposalCategories}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professionale">
          <ProfessionalSection
            professional={professional}
            stats={professionalStats}
          />
        </TabsContent>

        {/* Profile & Badges Tab */}
        <TabsContent value="profilo">
          <ProfileSection
            userProfile={userProfile}
            badges={badges}
            points={points}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
