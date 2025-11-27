'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================

interface UsePushNotificationsOptions {
  enabled?: boolean;
  onPermissionChange?: (permission: NotificationPermission) => void;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported on this device */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission | 'unsupported';
  /** Whether the user is currently subscribed to push notifications */
  isSubscribed: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Request notification permission without subscribing */
  requestPermission: () => Promise<NotificationPermission>;
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Convert VAPID public key from base64url to Uint8Array
 * Required by PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get device info for display in settings
 */
function getDeviceInfo(): {
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserName: string;
} {
  const ua = navigator.userAgent;

  // Detect browser
  let browserName = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browserName = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (ua.includes('Edg')) {
    browserName = 'Edge';
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browserName = 'Opera';
  }

  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/Mobi|Android/i.test(ua) && !/Tablet|iPad/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/Tablet|iPad/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Detect OS
  let osName = 'Unknown';
  if (ua.includes('Windows')) osName = 'Windows';
  else if (ua.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) osName = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) osName = 'Linux';
  else if (ua.includes('Android')) osName = 'Android';
  else if (ua.includes('iPhone')) osName = 'iPhone';
  else if (ua.includes('iPad')) osName = 'iPad';
  else if (ua.includes('CrOS')) osName = 'Chrome OS';

  return {
    deviceName: `${browserName} su ${osName}`,
    deviceType,
    browserName,
  };
}

// =====================================================
// HOOK
// =====================================================

export function usePushNotifications({
  enabled = true,
  onPermissionChange,
  onSubscriptionChange,
}: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // =====================================================
  // CHECK SUPPORT AND EXISTING SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    const checkSupport = async () => {
      // Check basic support
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        !!vapidPublicKey;

      setIsSupported(supported);

      if (!supported) {
        setPermission('unsupported');
        setIsLoading(false);
        return;
      }

      // Get current permission
      setPermission(Notification.permission);

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const hasSubscription = !!subscription;
        setIsSubscribed(hasSubscription);
        onSubscriptionChange?.(hasSubscription);
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }

      setIsLoading(false);
    };

    if (enabled) {
      checkSupport();
    }
  }, [enabled, vapidPublicKey, onSubscriptionChange]);

  // =====================================================
  // REQUEST PERMISSION
  // =====================================================

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange?.(result);
      return result;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return 'denied';
    }
  }, [isSupported, onPermissionChange]);

  // =====================================================
  // SUBSCRIBE
  // =====================================================

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !vapidPublicKey) {
      toast.error('Le notifiche push non sono supportate su questo dispositivo');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const perm = await requestPermission();
        if (perm !== 'granted') {
          toast.error('Devi consentire le notifiche per riceverle');
          setIsLoading(false);
          return false;
        }
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // Subscribe if not already subscribed
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Extract subscription data
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dhKey = subscriptionJson.keys?.p256dh || '';
      const authKey = subscriptionJson.keys?.auth || '';

      if (!endpoint || !p256dhKey || !authKey) {
        throw new Error('Invalid subscription data');
      }

      // Get device info
      const deviceInfo = getDeviceInfo();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Devi effettuare il login');
        setIsLoading(false);
        return false;
      }

      // Get tenant ID from user profile
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) {
        throw new Error('Tenant not found');
      }

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          tenant_id: userData.tenant_id,
          endpoint,
          p256dh_key: p256dhKey,
          auth_key: authKey,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          browser_name: deviceInfo.browserName,
          is_active: true,
          failed_count: 0,
        },
        {
          onConflict: 'user_id,endpoint',
        }
      );

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      onSubscriptionChange?.(true);
      toast.success('Notifiche push attivate!');
      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      toast.error("Errore durante l'attivazione delle notifiche");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey, requestPermission, supabase, onSubscriptionChange]);

  // =====================================================
  // UNSUBSCRIBE
  // =====================================================

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from database
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      onSubscriptionChange?.(false);
      toast.success('Notifiche push disattivate');
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      toast.error('Errore durante la disattivazione delle notifiche');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, onSubscriptionChange]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
