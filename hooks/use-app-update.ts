'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Check for updates every 5 minutes
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;

interface AppUpdateState {
  updateAvailable: boolean;
  newVersion: string | null;
  currentVersion: string | null;
}

/**
 * Hook that detects when a new app version is deployed.
 *
 * Uses two strategies:
 * 1. Polls /version.json periodically to detect server-side version changes
 * 2. Listens for SW_UPDATED messages from the service worker
 *
 * When an update is detected, returns `updateAvailable: true` so the UI
 * can show an "Aggiorna" banner.
 */
export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>({
    updateAvailable: false,
    newVersion: null,
    currentVersion: null,
  });

  const currentVersionRef = useRef<string | null>(null);
  const hasDetectedUpdate = useRef(false);

  // Reload to apply update
  const applyUpdate = useCallback(() => {
    // If there's a waiting SW, tell it to activate
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    window.location.reload();
  }, []);

  // Poll /version.json for server-side version changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', {
          cache: 'no-store',
          headers: { Pragma: 'no-cache' },
        });
        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = data.version as string;

        if (currentVersionRef.current === null) {
          // First check: store the current version
          currentVersionRef.current = serverVersion;
          setState((prev) => ({ ...prev, currentVersion: serverVersion }));
          return;
        }

        if (serverVersion !== currentVersionRef.current && !hasDetectedUpdate.current) {
          hasDetectedUpdate.current = true;
          setState({
            updateAvailable: true,
            newVersion: serverVersion,
            currentVersion: currentVersionRef.current,
          });

          // Also trigger a SW update check
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            registration?.update();
          }
        }
      } catch {
        // Network error, skip this check
      }
    };

    // First check after a short delay (let the page settle)
    const timeout = setTimeout(() => {
      checkVersion();
      interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Listen for SW_UPDATED messages from the service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED' && !hasDetectedUpdate.current) {
        hasDetectedUpdate.current = true;
        setState((prev) => ({
          ...prev,
          updateAvailable: true,
          newVersion: event.data.version || 'new',
        }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    ...state,
    applyUpdate,
  };
}
