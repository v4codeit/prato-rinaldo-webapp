'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';

// =====================================================
// TYPES
// =====================================================

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

// BeforeInstallPrompt event (Chromium-only)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export type InstallPlatform = 'chromium' | 'ios-safari' | 'ios-unsupported' | 'unsupported';

export interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  platform: InstallPlatform;
}

interface PWAInstallContextValue {
  state: PWAInstallState;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

// =====================================================
// PWA INSTALL CONTEXT
// =====================================================

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within ServiceWorkerProvider');
  }
  return context;
}

// =====================================================
// PLATFORM DETECTION
// =====================================================

function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'unsupported';

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  const isIOSChrome = isIOS && /CriOS/.test(ua);
  const isIOSFirefox = isIOS && /FxiOS/.test(ua);

  if (isIOSSafari) return 'ios-safari';
  if (isIOSChrome || isIOSFirefox) return 'ios-unsupported';

  // Will be upgraded to 'chromium' if beforeinstallprompt fires
  return 'unsupported';
}

function checkIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check display-mode media query (standalone = installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  // iOS Safari specific property
  const isIOSStandalone = (navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    registration: null,
    updateAvailable: false,
  });

  // PWA Install State
  const [installState, setInstallState] = useState<PWAInstallState>({
    deferredPrompt: null,
    isInstallable: false,
    isInstalled: false,
    platform: 'unsupported',
  });

  // Update service worker when new version is available
  const updateServiceWorker = useCallback(() => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swState.registration]);

  // Trigger native install prompt (Chromium browsers)
  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installState.deferredPrompt) return 'unavailable';

    try {
      await installState.deferredPrompt.prompt();
      const { outcome } = await installState.deferredPrompt.userChoice;

      // Clear the deferred prompt after use (can only be used once)
      setInstallState((prev) => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false,
      }));

      return outcome;
    } catch {
      return 'unavailable';
    }
  }, [installState.deferredPrompt]);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[SW Provider] Service workers not supported');
      return;
    }

    setSwState((prev) => ({ ...prev, isSupported: true }));

    // Only register in production (or when explicitly enabled)
    const isDev = process.env.NODE_ENV === 'development';
    const forceRegister = process.env.NEXT_PUBLIC_SW_DEV === 'true';

    if (isDev && !forceRegister) {
      console.log('[SW Provider] Skipping registration in development');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Always fetch sw.js from network, never HTTP cache
        });

        console.log('[SW Provider] Registered with scope:', registration.scope);

        setSwState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                console.log('[SW Provider] New version available');
                setSwState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW Provider] Controller changed');
        });

        // Periodically check for SW updates (every 60 minutes)
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {
            // Network error, skip this check
          });
        }, 60 * 60 * 1000);

        // Cleanup interval on unmount (stored on window for access)
        (window as any).__swUpdateInterval = updateInterval;
      } catch (error) {
        console.error('[SW Provider] Registration failed:', error);
      }
    };

    // Register when the page loads
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
      return () => window.removeEventListener('load', registerServiceWorker);
    }
  }, []);

  // Expose update function via custom event (optional)
  useEffect(() => {
    if (swState.updateAvailable) {
      // Dispatch custom event for update notification
      const event = new CustomEvent('swUpdateAvailable', {
        detail: { update: updateServiceWorker },
      });
      window.dispatchEvent(event);
    }
  }, [swState.updateAvailable, updateServiceWorker]);

  // =====================================================
  // PWA INSTALL DETECTION
  // =====================================================
  useEffect(() => {
    // Detect platform and check if already installed
    const platform = detectInstallPlatform();
    const isInstalled = checkIsInstalled();

    setInstallState((prev) => ({ ...prev, platform, isInstalled }));

    if (isInstalled) {
      console.log('[PWA Install] App is already installed');
      return;
    }

    // Listen for beforeinstallprompt (Chromium browsers only)
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log('[PWA Install] beforeinstallprompt event fired');

      setInstallState((prev) => ({
        ...prev,
        deferredPrompt: e,
        isInstallable: true,
        platform: 'chromium', // Upgrade platform since event fired
      }));
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('[PWA Install] App installed successfully');
      setInstallState((prev) => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Context value for PWA Install
  const installContextValue: PWAInstallContextValue = {
    state: installState,
    triggerInstall,
  };

  return (
    <PWAInstallContext.Provider value={installContextValue}>
      {children}
    </PWAInstallContext.Provider>
  );
}

// Hook to use service worker state (optional)
export function useServiceWorker() {
  const [state, setState] = useState<{
    isSupported: boolean;
    isReady: boolean;
  }>({
    isSupported: false,
    isReady: false,
  });

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setState({ isSupported, isReady: false });

    if (isSupported) {
      navigator.serviceWorker.ready.then(() => {
        setState({ isSupported: true, isReady: true });
      });
    }
  }, []);

  return state;
}
