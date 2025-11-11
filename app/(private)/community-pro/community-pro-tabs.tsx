'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTES } from '@/lib/utils/constants';
import { Heart, Briefcase, Phone, Mail, Loader2 } from 'lucide-react';
import { getShortName } from '@/lib/utils/format';
import { getApprovedServiceProfiles } from '@/app/actions/service-profiles';
import { ContextualFAB } from '@/components/community-pro/contextual-fab';

interface CommunityProTabsProps {
  activeTab: 'volunteer' | 'professional';
  initialVolunteers: any[];
  initialProfessionals: any[];
  initialVolunteersHasMore: boolean;
  initialProfessionalsHasMore: boolean;
}

export function CommunityProTabs({
  activeTab,
  initialVolunteers,
  initialProfessionals,
  initialVolunteersHasMore,
  initialProfessionalsHasMore
}: CommunityProTabsProps) {
  // State for volunteers
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [volunteersPage, setVolunteersPage] = useState(1);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersHasMore, setVolunteersHasMore] = useState(initialVolunteersHasMore);

  // State for professionals
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [professionalsPage, setProfessionalsPage] = useState(1);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);
  const [professionalsHasMore, setProfessionalsHasMore] = useState(initialProfessionalsHasMore);

  // Load more volunteers
  const loadMoreVolunteers = useCallback(async () => {
    if (volunteersLoading || !volunteersHasMore) return;

    setVolunteersLoading(true);
    const nextPage = volunteersPage + 1;

    const result = await getApprovedServiceProfiles({
      profileType: 'volunteer',
      page: nextPage,
      limit: 12
    });

    setVolunteers(prev => [...prev, ...result.profiles]);
    setVolunteersPage(nextPage);
    setVolunteersHasMore(result.pagination.hasMore);
    setVolunteersLoading(false);
  }, [volunteersLoading, volunteersHasMore, volunteersPage]);

  // Load more professionals
  const loadMoreProfessionals = useCallback(async () => {
    if (professionalsLoading || !professionalsHasMore) return;

    setProfessionalsLoading(true);
    const nextPage = professionalsPage + 1;

    const result = await getApprovedServiceProfiles({
      profileType: 'professional',
      page: nextPage,
      limit: 12
    });

    setProfessionals(prev => [...prev, ...result.profiles]);
    setProfessionalsPage(nextPage);
    setProfessionalsHasMore(result.pagination.hasMore);
    setProfessionalsLoading(false);
  }, [professionalsLoading, professionalsHasMore, professionalsPage]);

  // Custom hook for infinite scroll
  function useInfiniteScroll(
    onLoadMore: () => void,
    hasMore: boolean,
    loading: boolean
  ) {
    const observerRef = useRef<IntersectionObserver>();
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    }, [loading, hasMore, onLoadMore]);

    return loadMoreRef;
  }

  const volunteersLoadMoreRef = useInfiniteScroll(loadMoreVolunteers, volunteersHasMore, volunteersLoading);
  const professionalsLoadMoreRef = useInfiniteScroll(loadMoreProfessionals, professionalsHasMore, professionalsLoading);

  return (
    <div className="space-y-8">
      <Tabs defaultValue={activeTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
        <TabsTrigger value="volunteer" asChild>
          <Link href={`${ROUTES.COMMUNITY_PRO}?type=volunteer`}>
            <Heart className="h-4 w-4 mr-2" />
            Volontari
          </Link>
        </TabsTrigger>
        <TabsTrigger value="professional" asChild>
          <Link href={`${ROUTES.COMMUNITY_PRO}?type=professional`}>
            <Briefcase className="h-4 w-4 mr-2" />
            Professionisti
          </Link>
        </TabsTrigger>
      </TabsList>

      {/* Volunteers Tab */}
      <TabsContent value="volunteer">
        {volunteers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nessun volontario disponibile"
            description="Al momento non ci sono volontari registrati. Vuoi offrire il tuo aiuto alla community?"
            action={
              <Button size="lg" asChild>
                <Link href="/community-pro/apply/volunteer">
                  Diventa Volontario
                </Link>
              </Button>
            }
          />
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 pb-8">
              {volunteers.map((profile: any) => (
                <Link key={profile.id} href={`${ROUTES.COMMUNITY_PRO}/${profile.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={profile.user?.avatar || '/default-avatar.png'}
                          alt={profile.user?.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              <Heart className="h-3 w-3 mr-1" />
                              Volontario
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-2">{profile.business_name}</CardTitle>
                          <CardDescription>{getShortName(profile.user?.name || '')}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{profile.category}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {profile.description}
                      </p>

                      {profile.services && profile.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.services.slice(0, 3).map((service: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {profile.services.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {profile.availability_hours && (
                        <div className="text-sm font-medium text-muted-foreground">
                          Disponibilità: {profile.availability_hours} ore/settimana
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {profile.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">Tel</span>
                          </div>
                        )}
                        {profile.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">Email</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Infinite scroll trigger */}
              <div ref={volunteersLoadMoreRef} className="col-span-full h-20" />

              {/* Loading indicator */}
              {volunteersLoading && (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      {/* Professionals Tab */}
      <TabsContent value="professional">
        {professionals.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Nessun professionista disponibile"
            description="Al momento non ci sono professionisti registrati. Sei un professionista locale?"
            action={
              <Button size="lg" asChild>
                <Link href="/community-pro/apply/professional">
                  Crea Profilo Professionale
                </Link>
              </Button>
            }
          />
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 pb-8">
              {professionals.map((profile: any) => (
                <Link key={profile.id} href={`${ROUTES.COMMUNITY_PRO}/${profile.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={profile.user?.avatar || '/default-avatar.png'}
                          alt={profile.user?.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-600">
                              <Briefcase className="h-3 w-3 mr-1" />
                              Professionista
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-2">{profile.business_name}</CardTitle>
                          <CardDescription>{getShortName(profile.user?.name || '')}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{profile.category}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {profile.description}
                      </p>

                      {profile.services && profile.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.services.slice(0, 3).map((service: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {profile.services.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {profile.hourly_rate && (
                        <div className="text-sm font-medium text-muted-foreground">
                          Tariffa: {profile.hourly_rate}€/h
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {profile.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">Tel</span>
                          </div>
                        )}
                        {profile.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">Email</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Infinite scroll trigger */}
              <div ref={professionalsLoadMoreRef} className="col-span-full h-20" />

              {/* Loading indicator */}
              {professionalsLoading && (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </TabsContent>
    </Tabs>

    {/* Contextual FAB - only on mobile when profiles exist */}
    <ContextualFAB
      activeTab={activeTab}
      hasProfiles={volunteers.length > 0 || professionals.length > 0}
    />
    </div>
  );
}
