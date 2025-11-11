'use client';

import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PointsStats } from '@/types/bacheca';

interface LevelBannerProps {
  points: PointsStats;
  onClick?: () => void;
  className?: string;
}

/**
 * LevelBanner - Compact level/points display
 *
 * Shows user's current level, total points, and progress to next level
 * in a single-line banner format. Less intrusive than full StatCard.
 *
 * @example
 * <LevelBanner points={points} onClick={() => onTabChange('profilo')} />
 */
export function LevelBanner({ points, onClick, className }: LevelBannerProps) {
  // Calculate progress
  const pointsInCurrentLevel = points.total % 100;
  const pointsForNextLevel = 100;
  const progressPercentage = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  const pointsNeeded = pointsForNextLevel - pointsInCurrentLevel;
  const nextLevel = points.level + 1;

  // Dynamic level color
  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-600 dark:text-purple-400';
    if (level >= 5) return 'text-blue-600 dark:text-blue-400';
    if (level >= 3) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Livello ${points.level}, ${points.total} punti totali, ${pointsNeeded} punti al prossimo livello`}
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4',
        'px-4 py-3 rounded-lg border-2 transition-all',
        'bg-gradient-to-r from-primary/5 to-primary/10',
        'border-primary/20',
        onClick && [
          'cursor-pointer hover:border-primary/40 hover:shadow-md',
          'active:scale-[0.99]',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        ],
        className
      )}
    >
      {/* Level + Points Info */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('font-semibold', getLevelColor(points.level))}>
            Livello {points.level}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{points.total} punti</span>
        </div>
      </div>

      {/* Progress Bar + Label */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-[120px]">
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <TrendingUp className="h-3 w-3" />
            <span>
              {pointsNeeded === 100
                ? 'Inizia a guadagnare!'
                : `${pointsNeeded} punti al Livello ${nextLevel}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
