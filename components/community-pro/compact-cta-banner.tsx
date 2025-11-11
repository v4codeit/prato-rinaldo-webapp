'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompactCTABannerProps {
  className?: string;
}

/**
 * Compact CTA Banner for Community Pro page
 *
 * Desktop: Compact card with title + description (no icon, no buttons)
 * Mobile: Sticky banner always visible
 */
export function CompactCTABanner({ className }: CompactCTABannerProps) {
  return (
    <>
      {/* Mobile Banner - in-flow, edge-to-edge */}
      <div className="md:hidden px-4 py-3 bg-gradient-to-r from-primary/10 to-background border-y border-primary/20 border-t-0 mb-6">
        <h3 className="font-semibold text-sm leading-tight mb-1">
          Sei un Professionista o Volontario?
        </h3>
        <p className="text-xs text-muted-foreground leading-snug">
          Offri i tuoi servizi alla community
        </p>
      </div>

      {/* Desktop Card - compact */}
      <Card className={cn(
        "hidden md:block bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 mb-8",
        className
      )}>
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-xl mb-1">
            Sei un Professionista o Volontario?
          </CardTitle>
          <CardDescription className="text-sm">
            Offri i tuoi servizi alla community di Prato Rinaldo
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
