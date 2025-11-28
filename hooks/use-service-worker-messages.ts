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
        console.log('[App] Received notification click from SW, navigating to:', event.data.url);

        // Use router.push for client-side navigation
        // This preserves auth state and doesn't cause full page reload
        router.push(event.data.url as Route);
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
