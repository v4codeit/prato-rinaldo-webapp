'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share2, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePWAInstall } from '@/components/providers/service-worker-provider';

// =====================================================
// ITALIAN TRANSLATIONS
// =====================================================

const TEXT = {
  chromium: {
    title: "Installa l'app",
    description: 'Aggiungi Prato Rinaldo alla schermata Home per un accesso rapido.',
    installButton: 'Installa',
    dismissButton: 'Non ora',
  },
  iosSafari: {
    title: 'Installa su iPhone/iPad',
    description: 'Aggiungi Prato Rinaldo alla schermata Home.',
    showInstructions: 'Come fare',
    sheetTitle: 'Come installare',
    sheetDescription: "Segui questi passaggi per aggiungere l'app alla schermata Home",
    step1: 'Tocca il pulsante Condividi',
    step1Desc: 'nella barra di navigazione di Safari',
    step2: 'Tocca "Aggiungi alla schermata Home"',
    step2Desc: 'scorri il menu se necessario',
    step3: 'Conferma toccando "Aggiungi"',
    step3Desc: 'in alto a destra',
    done: 'Ho capito',
  },
  iosUnsupported: {
    title: 'Usa Safari',
    description: "Per installare l'app, apri questa pagina in Safari.",
  },
};

// =====================================================
// STORAGE
// =====================================================

const STORAGE_KEY = 'prato_install_prompt_dismissed';

function getDismissedTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value ? parseInt(value, 10) : null;
}

function setDismissedTimestamp(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

function shouldShowBasedOnDismissal(dismissDays: number): boolean {
  const dismissedAt = getDismissedTimestamp();
  if (!dismissedAt) return true;

  const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSinceDismiss >= dismissDays;
}

// =====================================================
// TYPES
// =====================================================

interface InstallPromptProps {
  dismissDays?: number;
  onInstall?: () => void;
  onDismiss?: () => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function InstallPrompt({
  dismissDays = 7,
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const { state, triggerInstall } = usePWAInstall();
  const { isInstallable, isInstalled, platform } = state;

  // =====================================================
  // MOUNT & DISMISSAL CHECK
  // =====================================================
  useEffect(() => {
    setMounted(true);

    // Check if should show based on localStorage
    const shouldShow = shouldShowBasedOnDismissal(dismissDays);
    setDismissed(!shouldShow);
  }, [dismissDays]);

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleDismiss = () => {
    setDismissed(true);
    setDismissedTimestamp();
    onDismiss?.();
  };

  const handleInstall = async () => {
    setIsInstalling(true);

    const outcome = await triggerInstall();

    setIsInstalling(false);

    if (outcome === 'accepted') {
      setDismissed(true);
      onInstall?.();
    }
  };

  const handleIOSInstructions = () => {
    setShowIOSSheet(true);
  };

  const handleIOSSheetClose = () => {
    setShowIOSSheet(false);
  };

  const handleIOSSheetDone = () => {
    setShowIOSSheet(false);
    handleDismiss();
  };

  // =====================================================
  // RENDER CONDITIONS
  // =====================================================

  // Don't render if:
  // - Not mounted (SSR)
  // - Already installed
  // - Dismissed by user
  if (!mounted || isInstalled || dismissed) {
    return null;
  }

  // For Chromium: only show if beforeinstallprompt fired
  if (platform === 'chromium' && !isInstallable) {
    return null;
  }

  // Completely unsupported (Firefox/Safari desktop)
  if (platform === 'unsupported') {
    return null;
  }

  // =====================================================
  // iOS SAFARI INSTRUCTIONS SHEET
  // =====================================================
  const IOSInstructionsSheet = () => (
    <Sheet open={showIOSSheet} onOpenChange={handleIOSSheetClose}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="text-xl">{TEXT.iosSafari.sheetTitle}</SheetTitle>
          <SheetDescription>{TEXT.iosSafari.sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <Share2 className="h-5 w-5 text-[#007AFF]" />
                {TEXT.iosSafari.step1}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {TEXT.iosSafari.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <Plus className="h-5 w-5 text-[#007AFF]" />
                {TEXT.iosSafari.step2}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {TEXT.iosSafari.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium">{TEXT.iosSafari.step3}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {TEXT.iosSafari.step3Desc}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleIOSSheetDone}
          className="w-full mt-4 bg-[#007AFF] hover:bg-[#0066CC]"
        >
          {TEXT.iosSafari.done}
        </Button>
      </SheetContent>
    </Sheet>
  );

  // =====================================================
  // BANNER UI
  // =====================================================
  return (
    <>
      {/* iOS Instructions Sheet */}
      <IOSInstructionsSheet />

      {/* Install Banner */}
      <div className="fixed bottom-20 left-0 right-0 z-40 p-4 md:bottom-4">
        <Card className="relative bg-background border-primary/20 shadow-lg max-w-md mx-auto">
          <CardContent className="p-4 pr-10">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                {platform === 'ios-unsupported' ? (
                  <Smartphone className="h-5 w-5 text-primary" />
                ) : (
                  <Download className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {platform === 'chromium' && (
                  <>
                    <p className="font-medium text-sm">{TEXT.chromium.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TEXT.chromium.description}
                    </p>
                  </>
                )}

                {platform === 'ios-safari' && (
                  <>
                    <p className="font-medium text-sm">{TEXT.iosSafari.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TEXT.iosSafari.description}
                    </p>
                  </>
                )}

                {platform === 'ios-unsupported' && (
                  <>
                    <p className="font-medium text-sm">{TEXT.iosUnsupported.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TEXT.iosUnsupported.description}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDismiss}
              >
                {TEXT.chromium.dismissButton}
              </Button>

              {platform === 'chromium' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? 'Installazione...' : TEXT.chromium.installButton}
                </Button>
              )}

              {platform === 'ios-safari' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleIOSInstructions}
                >
                  {TEXT.iosSafari.showInstructions}
                </Button>
              )}

              {platform === 'ios-unsupported' && (
                <Button
                  size="sm"
                  className="flex-1"
                  variant="secondary"
                  disabled
                >
                  Safari richiesto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
