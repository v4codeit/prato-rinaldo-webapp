'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    registration: null,
    updateAvailable: false,
  });

  // Update service worker when new version is available
  const updateServiceWorker = useCallback(() => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swState.registration]);

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
          console.log('[SW Provider] Controller changed, reloading...');
          // Page will reload automatically after update
        });
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

  return <>{children}</>;
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
