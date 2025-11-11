'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target, Zap } from 'lucide-react';
import type { PointsStats } from '@/types/bacheca';

interface LevelProgressProps {
  points: PointsStats;
}

/**
 * Level Progress Component
 *
 * Displays user's current level, total points, and progress to next level.
 * Visual and engaging gamification UI.
 *
 * Level Calculation:
 * - Level = floor(total points / 100)
 * - Progress to next level = (total points % 100)
 * - Next level at = (level + 1) * 100 points
 *
 * Features:
 * - Large level display with trophy icon
 * - Animated progress bar
 * - Points breakdown
 * - Next level target
 * - Motivational messaging
 *
 * @example
 * <LevelProgress points={{ total: 250, level: 2 }} />
 */
export function LevelProgress({ points }: LevelProgressProps) {
  // Calculate progress to next level
  const pointsInCurrentLevel = points.total % 100;
  const pointsForNextLevel = 100;
  const progressPercentage = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  const pointsNeeded = pointsForNextLevel - pointsInCurrentLevel;
  const nextLevel = points.level + 1;

  // Level tier colors
  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-600 dark:text-purple-400';
    if (level >= 5) return 'text-blue-600 dark:text-blue-400';
    if (level >= 3) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getLevelBadge = (level: number) => {
    if (level >= 10) return 'Leggenda';
    if (level >= 5) return 'Esperto';
    if (level >= 3) return 'Intermedio';
    return 'Principiante';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Livello & Progressi
        </CardTitle>
        <CardDescription>
          Guadagna punti completando attività sulla piattaforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Livello Attuale</span>
              <span className={`text-5xl font-bold ${getLevelColor(points.level)}`}>
                {points.level}
              </span>
            </div>
            <Badge variant="secondary" className="h-fit">
              {getLevelBadge(points.level)}
            </Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Punti Totali
            </div>
            <div className="text-2xl font-semibold">{points.total}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Progresso al Livello {nextLevel}
            </span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{pointsInCurrentLevel} punti</span>
            <span>{pointsForNextLevel} punti</span>
          </div>
        </div>

        {/* Points Needed */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Target className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {pointsNeeded === 100 ? (
                <>Inizia a guadagnare punti!</>
              ) : (
                <>
                  Mancano <span className="text-primary font-bold">{pointsNeeded}</span> punti al livello {nextLevel}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Completa attività, pubblica contenuti, e partecipa alla community
            </p>
          </div>
        </div>

        {/* How Points Work */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Come Funzionano i Punti</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <p>Ogni 100 punti raggiungi un nuovo livello</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <p>I badge guadagnati ti assegnano punti automaticamente</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <p>Partecipa attivamente per sbloccare nuovi badge</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
