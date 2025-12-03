'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { MobileMenuDrawer } from './mobile-menu-drawer';
import { NotificationDrawer } from '@/components/organisms/notifications/notification-drawer';

interface MobileHeaderContentProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
}

export function MobileHeaderContent({ user }: MobileHeaderContentProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between h-14 px-4 bg-white border-b">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <MobileMenuDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={user} />

      <div className="flex items-center gap-2">
        {/* Search commented out as requested */}
        {/* <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button> */}

        <NotificationDrawer />
      </div>
    </div>
  );
}
