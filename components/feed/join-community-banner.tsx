'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

interface JoinCommunityBannerProps {
  variant: 'mobile' | 'desktop';
}

const STORAGE_KEY = 'join-banner-dismissed';

/**
 * Join Community Banner Component
 *
 * CTA banner for non-registered users with two variants:
 * - Mobile: Fixed bottom dismissible banner (z-35, above bottom nav z-40)
 * - Desktop: Sticky top banner (z-20, below SubHeader z-30)
 *
 * Features:
 * - localStorage persistence for dismiss state
 * - Responsive design with variant-specific layouts
 * - Accessible close button with ARIA labels
 * - Links to registration and login routes
 *
 * Z-index hierarchy:
 * - Mobile (z-35): Above bottom nav (z-40) but below modals (z-50)
 * - Desktop (z-20): Below SubHeader (z-30) and PageLayout sidebar
 *
 * Usage:
 * <JoinCommunityBanner variant="mobile" />
 * <JoinCommunityBanner variant="desktop" />
 */
export function JoinCommunityBanner({ variant }: JoinCommunityBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) return null;

  // Mobile variant: compact bottom banner
  if (variant === 'mobile') {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-35 p-4 md:hidden">
        <Card className="relative bg-primary/5 border-primary/20 shadow-lg">
          <CardContent className="p-4 pr-10">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 rounded-full p-1 hover:bg-primary/10 transition-colors"
              aria-label="Chiudi banner"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">🚀</span>
                  <h3 className="font-semibold text-base">
                    Entra nella Comunità
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Registrati per partecipare alle discussioni e accedere a tutti i servizi.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  className="flex-1"
                >
                  <Link href={ROUTES.REGISTER}>
                    Registrati
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Link href={ROUTES.LOGIN}>
                    Accedi
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop variant: sticky top banner with horizontal layout
  return (
    <div className="sticky top-20 z-20 mb-6 hidden md:block">
      <Card className="relative bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 shadow-md">
        <CardContent className="p-6 pr-12">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-primary/10 transition-colors"
            aria-label="Chiudi banner"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Horizontal layout */}
          <div className="flex items-center gap-6">
            {/* Emoji */}
            <div className="flex-shrink-0">
              <span className="text-4xl" aria-hidden="true">🚀</span>
            </div>

            {/* Text content */}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg">
                Diventa parte della Community Prato Rinaldo
              </h3>
              <p className="text-sm text-muted-foreground">
                Registrati gratuitamente per accedere al forum, agli eventi, al marketplace e a tutti i servizi della community.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0 flex gap-3">
              <Button
                asChild
                size="lg"
              >
                <Link href={ROUTES.REGISTER}>
                  Registrati
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
              >
                <Link href={ROUTES.LOGIN}>
                  Accedi
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
