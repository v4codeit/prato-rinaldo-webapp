'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Briefcase } from 'lucide-react';

interface ContextualFABProps {
  activeTab: 'volunteer' | 'professional';
  hasProfiles: boolean;
}

/**
 * Contextual Floating Action Button for Community Pro
 *
 * Changes icon and destination based on active tab:
 * - volunteer tab → Heart icon → /community-pro/apply/volunteer
 * - professional tab → Briefcase icon → /community-pro/apply/professional
 *
 * Only visible on mobile when there are profiles in the list
 */
export function ContextualFAB({ activeTab, hasProfiles }: ContextualFABProps) {
  // Only show if there are profiles
  if (!hasProfiles) return null;

  const isVolunteer = activeTab === 'volunteer';
  const href = isVolunteer
    ? '/community-pro/apply/volunteer'
    : '/community-pro/apply/professional';
  const label = isVolunteer
    ? 'Candidati come Volontario'
    : 'Candidati come Professionista';
  const Icon = isVolunteer ? Heart : Briefcase;

  return (
    <Button
      size="lg"
      asChild
      className="md:hidden fixed bottom-20 right-4 z-35 rounded-full w-14 h-14 p-0 shadow-2xl hover:shadow-xl transition-all"
      aria-label={label}
    >
      <Link href={href}>
        <Icon className="h-6 w-6" />
      </Link>
    </Button>
  );
}
