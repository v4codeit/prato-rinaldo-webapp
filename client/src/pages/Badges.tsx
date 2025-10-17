import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, Award, Star } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Badges() {
  const { user, isAuthenticated } = useAuth();
  const { data: allBadges } = trpc.gamification.listBadges.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: userBadges } = trpc.gamification.getUserBadges.useQuery({ userId: user?.id }, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: userPoints } = trpc.gamification.getUserPoints.useQuery({ userId: user?.id }, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });

  if (!isAuthenticated || user?.verificationStatus !== 'approved') {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge.id) || []);

  return (
    <div className="container py-8 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Badge e Gamification</h1>
        <p className="text-lg text-muted-foreground">
          Guadagna badge contribuendo alla comunità di Prato Rinaldo
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-primary" />
            I Tuoi Punti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary">{userPoints || 0}</div>
          <p className="text-muted-foreground mt-2">
            {userBadges?.length || 0} badge guadagnati
          </p>
        </CardContent>
      </Card>

      {userBadges && userBadges.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Award className="h-6 w-6" />
            I Tuoi Badge
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBadges.map(({ userBadge, badge }) => (
              <Card key={userBadge.id} className="border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        {badge.name}
                      </CardTitle>
                      {badge.description && (
                        <CardDescription className="mt-2">{badge.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">{badge.points} pt</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Guadagnato il {new Date(userBadge.earnedAt!).toLocaleDateString('it-IT')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tutti i Badge Disponibili</h2>
        {allBadges && allBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBadges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              return (
                <Card key={badge.id} className={isEarned ? "" : "opacity-60"}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {isEarned ? (
                            <Star className="h-5 w-5 text-primary" />
                          ) : (
                            <Star className="h-5 w-5 text-muted-foreground" />
                          )}
                          {badge.name}
                        </CardTitle>
                        {badge.description && (
                          <CardDescription className="mt-2">{badge.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={isEarned ? "default" : "outline"}>{badge.points} pt</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nessun badge disponibile al momento</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

