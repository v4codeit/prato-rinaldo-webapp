'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================

interface NotificationPreferences {
  push_enabled: boolean;
  push_messages: boolean;
  push_mentions: boolean;
  push_events: boolean;
  push_proposals: boolean;
  push_marketplace: boolean;
  push_community_pro: boolean;
  push_announcements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface PushSubscriptionInfo {
  id: string;
  device_name: string | null;
  device_type: string | null;
  browser_name: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  push_messages: true,
  push_mentions: true,
  push_events: true,
  push_proposals: true,
  push_marketplace: true,
  push_community_pro: true,
  push_announcements: true,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

// =====================================================
// DEVICE ICON COMPONENT
// =====================================================

function DeviceIcon({ type }: { type: string | null }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    case 'tablet':
      return <Tablet className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Monitor className="h-5 w-5 text-muted-foreground" />;
  }
}

// =====================================================
// NOTIFICATION SETTINGS COMPONENT
// =====================================================

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(
    null
  );
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isSupported, permission, isSubscribed, subscribe, unsubscribe, isLoading } =
    usePushNotifications();

  const supabase = createClient();

  // =====================================================
  // FETCH DATA
  // =====================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch preferences
        const { data: prefs } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefs) {
          setPreferences(prefs as NotificationPreferences);
        } else {
          setPreferences(defaultPreferences);
        }

        // Fetch subscriptions
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('id, device_name, device_type, browser_name, is_active, created_at, last_used_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setSubscriptions(subs || []);
      } catch (error) {
        console.error('[NotificationSettings] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, isSubscribed]);

  // =====================================================
  // UPDATE PREFERENCE
  // =====================================================

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!preferences) return;

    setSaving(true);

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant ID
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) {
        toast.error('Errore nel recupero dei dati utente');
        setPreferences(preferences); // Revert
        return;
      }

      const { error } = await supabase.from('user_notification_preferences').upsert(
        {
          user_id: user.id,
          tenant_id: userData.tenant_id,
          ...newPrefs,
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) {
        toast.error('Errore nel salvataggio delle preferenze');
        setPreferences(preferences); // Revert
      }
    } catch (error) {
      console.error('[NotificationSettings] Error updating preference:', error);
      toast.error('Errore nel salvataggio delle preferenze');
      setPreferences(preferences); // Revert
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // REMOVE SUBSCRIPTION
  // =====================================================

  const removeSubscription = async (subId: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subId);

      if (error) {
        toast.error('Errore nella rimozione del dispositivo');
      } else {
        setSubscriptions(subscriptions.filter((s) => s.id !== subId));
        toast.success('Dispositivo rimosso');
      }
    } catch (error) {
      console.error('[NotificationSettings] Error removing subscription:', error);
      toast.error('Errore nella rimozione del dispositivo');
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Push Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifiche Push
          </CardTitle>
          <CardDescription>
            Ricevi notifiche anche quando l&apos;app è chiusa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted rounded-lg">
              <BellOff className="h-4 w-4" />
              <span className="text-sm">
                Le notifiche push non sono supportate su questo dispositivo.
                {typeof window !== 'undefined' &&
                  !window.matchMedia('(display-mode: standalone)').matches &&
                  ' Installa l\'app per abilitarle.'}
              </span>
            </div>
          ) : permission === 'denied' ? (
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
              <BellOff className="h-4 w-4" />
              <span className="text-sm">
                Le notifiche sono state bloccate. Abilita dalle impostazioni del browser.
              </span>
            </div>
          ) : isSubscribed ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Notifiche attive su questo dispositivo</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={isLoading}
              >
                {isLoading ? 'Disattivazione...' : 'Disattiva'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                Attiva le notifiche per questo dispositivo
              </span>
              <Button size="sm" onClick={subscribe} disabled={isLoading}>
                <Bell className="h-4 w-4 mr-2" />
                {isLoading ? 'Attivazione...' : 'Attiva'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Card */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Tipi di Notifica</CardTitle>
            <CardDescription>Scegli quali notifiche ricevere</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Global toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push_enabled" className="font-medium">
                  Notifiche push
                </Label>
                <p className="text-xs text-muted-foreground">
                  Abilita o disabilita tutte le notifiche
                </p>
              </div>
              <Switch
                id="push_enabled"
                checked={preferences.push_enabled}
                onCheckedChange={(v) => updatePreference('push_enabled', v)}
                disabled={saving}
              />
            </div>

            <Separator />

            {/* Individual toggles */}
            <div className={preferences.push_enabled ? '' : 'opacity-50 pointer-events-none'}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push_messages">Messaggi nei topic</Label>
                  <Switch
                    id="push_messages"
                    checked={preferences.push_messages}
                    onCheckedChange={(v) => updatePreference('push_messages', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push_mentions">Menzioni (@nome)</Label>
                  <Switch
                    id="push_mentions"
                    checked={preferences.push_mentions}
                    onCheckedChange={(v) => updatePreference('push_mentions', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push_events">Eventi e promemoria</Label>
                  <Switch
                    id="push_events"
                    checked={preferences.push_events}
                    onCheckedChange={(v) => updatePreference('push_events', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push_proposals">Proposte (Agorà)</Label>
                  <Switch
                    id="push_proposals"
                    checked={preferences.push_proposals}
                    onCheckedChange={(v) => updatePreference('push_proposals', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push_marketplace">Marketplace</Label>
                  <Switch
                    id="push_marketplace"
                    checked={preferences.push_marketplace}
                    onCheckedChange={(v) => updatePreference('push_marketplace', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push_announcements">Annunci</Label>
                  <Switch
                    id="push_announcements"
                    checked={preferences.push_announcements}
                    onCheckedChange={(v) => updatePreference('push_announcements', v)}
                    disabled={saving || !preferences.push_enabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registered Devices Card */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispositivi Registrati</CardTitle>
            <CardDescription>
              Dispositivi che ricevono notifiche push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <DeviceIcon type={sub.device_type} />
                  <div>
                    <p className="font-medium text-sm">
                      {sub.device_name || 'Dispositivo sconosciuto'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aggiunto il{' '}
                      {new Date(sub.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.is_active ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      Attivo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inattivo</Badge>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Rimuovi dispositivo</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rimuovere questo dispositivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Non riceverai più notifiche push su &quot;{sub.device_name}&quot;.
                          Potrai sempre riattivare le notifiche in seguito.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeSubscription(sub.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Rimuovi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
