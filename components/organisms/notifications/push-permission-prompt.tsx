'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface PushPermissionPromptProps {
  /** When to dismiss the prompt */
  onDismiss?: () => void;
  /** Visual style variant */
  variant?: 'card' | 'banner' | 'minimal';
  /** How many days to wait before showing again after dismiss */
  dismissDays?: number;
}

const STORAGE_KEY = 'prato_push_prompt_dismissed';

export function PushPermissionPrompt({
  onDismiss,
  variant = 'card',
  dismissDays = 7,
}: PushPermissionPromptProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [mounted, setMounted] = useState(false);

  const { isSupported, permission, isSubscribed, isLoading, subscribe } =
    usePushNotifications();

  // Check if should show prompt
  useEffect(() => {
    setMounted(true);

    // Check localStorage for previous dismissal
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const daysSinceDismiss =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < dismissDays) {
        return; // Keep dismissed
      }
    }

    // Show prompt if conditions are met
    setDismissed(false);
  }, [dismissDays]);

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    onDismiss?.();
  };

  // Handle enable
  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setDismissed(true);
    }
  };

  // Don't render if:
  // - Not mounted (SSR)
  // - Not supported
  // - Already subscribed
  // - Permission denied (can't ask again)
  // - Dismissed by user
  if (
    !mounted ||
    !isSupported ||
    isSubscribed ||
    permission === 'denied' ||
    dismissed
  ) {
    return null;
  }

  // =====================================================
  // BANNER VARIANT (Fixed bottom on mobile)
  // =====================================================
  if (variant === 'banner') {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 z-40 animate-in slide-in-from-bottom-5 duration-300">
        <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                <Bell className="h-5 w-5 text-primary" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Attiva le notifiche</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ricevi aggiornamenti dalla community
                </p>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8 -mr-2 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Chiudi</span>
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDismiss}
              >
                Non ora
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleEnable}
                disabled={isLoading}
              >
                {isLoading ? 'Attivazione...' : 'Attiva'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================
  // MINIMAL VARIANT (Just a button)
  // =====================================================
  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnable}
        disabled={isLoading}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        {isLoading ? 'Attivazione...' : 'Attiva notifiche'}
      </Button>
    );
  }

  // =====================================================
  // CARD VARIANT (Default - for settings/sidebar)
  // =====================================================
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Notifiche Push</CardTitle>
            <CardDescription className="text-xs">
              Ricevi aggiornamenti in tempo reale
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground mb-4">
          Attiva le notifiche per ricevere aggiornamenti sui nuovi messaggi,
          eventi e annunci della community.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Non ora
          </Button>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isLoading ? 'Attivazione...' : 'Attiva'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
