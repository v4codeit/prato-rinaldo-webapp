'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Settings, X } from 'lucide-react';
import { NotificationList } from '@/components/organisms/notifications/notification-list';
import { ROUTES } from '@/lib/utils/constants';
import type { UserNotification } from '@/types/notifications';

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Notification center drawer
 * Opens from the right side of the screen
 * Contains tabs for filtering notifications
 */
export function NotificationDrawer({
  open,
  onOpenChange,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading,
}: NotificationDrawerProps) {
  const router = useRouter();

  // Filter notifications by status
  const unreadNotifications = React.useMemo(
    () =>
      notifications.filter(
        (n) => n.status === 'unread' || n.status === 'action_pending'
      ),
    [notifications]
  );

  const actionNotifications = React.useMemo(
    () => notifications.filter((n) => n.requires_action && n.status !== 'action_completed'),
    [notifications]
  );

  // Handle notification click
  const handleNotificationClick = async (notification: UserNotification) => {
    // Mark as read (but keep action_pending if requires_action)
    if (notification.status === 'unread') {
      await onMarkAsRead(notification.id);
    }

    // Navigate if action_url exists
    if (notification.action_url) {
      onOpenChange(false);
      router.push(notification.action_url as Route);
    }
  };

  // Navigate to settings
  const handleSettingsClick = () => {
    onOpenChange(false);
    router.push(`${ROUTES.SETTINGS}/notifications` as Route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 [&>button]:hidden">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifiche
            </SheetTitle>
            <div className="flex items-center gap-1">
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs h-8"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Segna tutte lette
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSettingsClick}
                className="h-8 w-8"
                aria-label="Impostazioni notifiche"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
                aria-label="Chiudi notifiche"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="all" className="h-[calc(100vh-80px)]">
          <TabsList className="w-full justify-start px-4 py-2 bg-transparent border-b rounded-none h-auto">
            <TabsTrigger
              value="all"
              className="rounded-full data-[state=active]:bg-slate-100"
            >
              Tutte ({notifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-full data-[state=active]:bg-slate-100"
            >
              Non lette ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="rounded-full data-[state=active]:bg-slate-100"
            >
              Azioni ({actionNotifications.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100%-48px)]">
            {/* All notifications */}
            <TabsContent value="all" className="m-0">
              <NotificationList
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                isLoading={isLoading}
                emptyMessage="Nessuna notifica"
              />
            </TabsContent>

            {/* Unread notifications */}
            <TabsContent value="unread" className="m-0">
              <NotificationList
                notifications={unreadNotifications}
                onNotificationClick={handleNotificationClick}
                isLoading={isLoading}
                emptyMessage="Nessuna notifica non letta"
              />
            </TabsContent>

            {/* Action pending notifications */}
            <TabsContent value="actions" className="m-0">
              <NotificationList
                notifications={actionNotifications}
                onNotificationClick={handleNotificationClick}
                isLoading={isLoading}
                emptyMessage="Nessuna azione richiesta"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
