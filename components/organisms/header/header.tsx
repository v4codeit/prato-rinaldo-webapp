'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { UserAvatarDropdown } from '@/components/molecules/user-avatar-dropdown';
import { NotificationBell } from './notification-bell';
import { NotificationDrawer } from './notification-drawer';
import { useNotifications } from '@/hooks/use-notifications';

interface HeaderProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Use notifications hook only for authenticated users
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    userId: user?.id,
    enabled: !!user,
  });

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
              PR
            </div>
            <span className="text-xl font-bold hidden md:block">{APP_NAME}</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-600 hover:bg-slate-100">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications - only for authenticated users */}
            {user && (
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setDrawerOpen(true)}
              />
            )}

            {user ? (
              <UserAvatarDropdown user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link href={ROUTES.LOGIN}>Accedi</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full bg-teal-600 hover:bg-teal-700">
                  <Link href={ROUTES.REGISTER}>Registrati</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      {user && (
        <NotificationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
