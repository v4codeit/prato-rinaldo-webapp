'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

/**
 * Hook to handle messages from the Service Worker.
 *
 * Used as a fallback when the SW's client.navigate() fails.
 * The SW sends a NOTIFICATION_CLICK message with the URL to navigate to.
 *
 * @example
 * ```tsx
 * // In your layout client component
 * import { useServiceWorkerMessages } from '@/hooks/use-service-worker-messages';
 *
 * export function MainLayoutClient({ children }) {
 *   useServiceWorkerMessages();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useServiceWorkerMessages() {
  const router = useRouter();

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Handle notification click fallback from SW
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        const rawUrl = event.data.url;
        console.log('[App] Received notification click from SW:', rawUrl);

        // Normalize URL: extract path from full URL if needed
        // router.push() expects relative path, not full URL
        let targetPath: string;
        try {
          const url = new URL(rawUrl, window.location.origin);
          // Only use pathname if same origin
          if (url.origin === window.location.origin) {
            targetPath = url.pathname + url.search + url.hash;
          } else {
            // Different origin - this shouldn't happen, but fallback to bacheca
            console.warn('[App] Different origin URL received, ignoring:', rawUrl);
            targetPath = '/bacheca';
          }
        } catch {
          // If URL parsing fails, assume it's already a relative path
          targetPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        }

        console.log('[App] Navigating to:', targetPath);

        // Use router.push for client-side navigation
        // This preserves auth state and doesn't cause full page reload
        router.push(targetPath as Route);
      }
    };

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [router]);
}
