import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { getApprovedServiceProfiles } from '@/app/actions/service-profiles';
import { SERVICE_PROFILE_TYPE, ROUTES } from '@/lib/utils/constants';
import { Heart, Briefcase, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Community Pro',
  description: 'Trova volontari e professionisti fidati nella community',
};

export default async function CommunityProPage({
  searchParams,
}: {
  searchParams: { type?: 'volunteer' | 'professional' };
}) {
  const activeTab = searchParams.type || 'volunteer';

  // Fetch both volunteers and professionals
  const { profiles: volunteers } = await getApprovedServiceProfiles({
    profileType: SERVICE_PROFILE_TYPE.VOLUNTEER,
  });

  const { profiles: professionals } = await getApprovedServiceProfiles({
    profileType: SERVICE_PROFILE_TYPE.PROFESSIONAL,
  });

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Community Pro</h1>
        <p className="text-lg text-muted-foreground">
          Trova volontari e professionisti pronti ad aiutarti nella community
        </p>
      </div>

      {/* Tabs */}
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
                  <Link href={`${ROUTES.COMMUNITY_PRO}/new?type=volunteer`}>
                    Diventa Volontario
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <CardDescription>{profile.user?.name}</CardDescription>
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

                        {profile.rate_or_reimbursement && (
                          <div className="text-sm font-medium text-muted-foreground">
                            Rimborso: {profile.rate_or_reimbursement}€
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
              </div>

              <div className="mt-12 text-center">
                <Button size="lg" asChild>
                  <Link href={`${ROUTES.COMMUNITY_PRO}/new?type=volunteer`}>
                    Diventa Volontario
                  </Link>
                </Button>
              </div>
            </>
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
                  <Link href={`${ROUTES.COMMUNITY_PRO}/new?type=professional`}>
                    Crea Profilo Professionale
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <CardDescription>{profile.user?.name}</CardDescription>
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

                        {profile.rate_or_reimbursement && (
                          <div className="text-sm font-medium text-muted-foreground">
                            Tariffa: {profile.rate_or_reimbursement}€/h
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
              </div>

              <div className="mt-12 text-center">
                <Button size="lg" asChild>
                  <Link href={`${ROUTES.COMMUNITY_PRO}/new?type=professional`}>
                    Crea Profilo Professionale
                  </Link>
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
