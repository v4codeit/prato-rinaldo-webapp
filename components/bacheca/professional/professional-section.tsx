'use client';

import { ProfessionalProfileWithActions, ProfessionalStats } from '@/types/bacheca';
import { ProfileDisplay } from './profile-display';
import { CreateProfileCta } from './create-profile-cta';

interface ProfessionalSectionProps {
  professional: ProfessionalProfileWithActions | null;
  stats: ProfessionalStats;
}

/**
 * Main Professional Profile Section Component
 *
 * Displays either:
 * - Full profile view with stats and actions (if profile exists)
 * - CTA to create profile (if no profile)
 *
 * Mobile-first responsive design
 */
export function ProfessionalSection({ professional, stats }: ProfessionalSectionProps) {
  if (!professional) {
    return <CreateProfileCta />;
  }

  return <ProfileDisplay professional={professional} stats={stats} />;
}
