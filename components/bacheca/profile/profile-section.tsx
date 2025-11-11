'use client';

import type { UserProfile, UserBadgeWithDetails, PointsStats } from '@/types/bacheca';
import { ProfileEditForm } from './profile-edit-form';
import { BadgesDisplay } from './badges-display';
import { LevelProgress } from './level-progress';

interface ProfileSectionProps {
  userProfile: UserProfile;
  badges: UserBadgeWithDetails[];
  points: PointsStats;
}

/**
 * Profile & Badges Tab Section
 *
 * Main component that combines profile editing, badges display, and level progress.
 * Mobile-first responsive layout: stacked on mobile, 2-column on desktop.
 *
 * @example
 * <ProfileSection userProfile={user} badges={badges} points={points} />
 */
export function ProfileSection({ userProfile, badges, points }: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      {/* Mobile: Stack all sections */}
      {/* Desktop: 2-column layout (form left, gamification right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Profile Edit Form */}
        <div className="space-y-6">
          <ProfileEditForm userProfile={userProfile} />
        </div>

        {/* Right Column: Gamification (Level Progress + Badges) */}
        <div className="space-y-6">
          <LevelProgress points={points} />
          <BadgesDisplay badges={badges} />
        </div>
      </div>
    </div>
  );
}
