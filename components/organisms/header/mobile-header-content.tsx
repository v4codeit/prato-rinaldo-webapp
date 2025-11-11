'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { MobileMenuDrawer } from './mobile-menu-drawer';

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
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Vaul Drawer */}
      <MobileMenuDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={user} />
    </>
  );
}
