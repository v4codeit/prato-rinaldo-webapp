'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Star, Sparkles } from 'lucide-react';
import type { UserBadgeWithDetails } from '@/types/bacheca';

interface BadgesDisplayProps {
  badges: UserBadgeWithDetails[];
}

/**
 * Badges Display Component
 *
 * Shows all earned badges in a responsive grid layout.
 * Each badge card displays icon, name, description, points, and earned date.
 *
 * Layout:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 2 columns (in right sidebar)
 *
 * Features:
 * - Responsive grid
 * - Badge metadata (points, date)
 * - Empty state with motivational message
 * - Badge categories/points color coding
 *
 * @example
 * <BadgesDisplay badges={userBadges} />
 */
export function BadgesDisplay({ badges }: BadgesDisplayProps) {
  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get points color
  const getPointsColor = (points: number) => {
    if (points >= 50) return 'text-purple-600 dark:text-purple-400';
    if (points >= 30) return 'text-blue-600 dark:text-blue-400';
    if (points >= 10) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Badge Guadagnati
        </CardTitle>
        <CardDescription>
          {badges.length > 0
            ? `Hai guadagnato ${badges.length} badge${badges.length === 1 ? '' : 's'}!`
            : 'Inizia a guadagnare badge completando attività'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nessun badge ancora</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Partecipa alla community, pubblica contenuti, e completa attività per guadagnare i tuoi primi badge!
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground max-w-xs">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Pubblica una proposta</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Partecipa a eventi</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Vendi un articolo</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Diventa volontario</span>
              </div>
            </div>
          </div>
        ) : (
          // Badges Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map((userBadge) => {
              const badge = userBadge.badge;
              if (!badge) return null;

              return (
                <div
                  key={userBadge.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                >
                  {/* Badge Icon & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl flex-shrink-0">{badge.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Badge Metadata */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(userBadge.earned_at)}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getPointsColor(badge.points)}`}
                    >
                      +{badge.points} punti
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {badges.length > 0 && (
          <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Totale Badge: <span className="font-semibold text-foreground">{badges.length}</span>
            </div>
            <div className="text-muted-foreground">
              Punti dai Badge:{' '}
              <span className="font-semibold text-foreground">
                {badges.reduce((sum, ub) => sum + (ub.badge?.points || 0), 0)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
