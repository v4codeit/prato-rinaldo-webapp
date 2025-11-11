'use client';

import { useState } from 'react';
import { Home, MessageSquare, Calendar, Users, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import { MobileMenuDrawer } from '@/components/organisms/header/mobile-menu-drawer';

const NAV_ITEMS = [
  { icon: Home, href: ROUTES.HOME, label: 'Home' },
  { icon: MessageSquare, href: ROUTES.FEED, label: 'Bacheca' },
  { icon: Calendar, href: ROUTES.EVENTS, label: 'Eventi' },
  { icon: Users, href: ROUTES.COMMUNITY_PRO, label: 'Community' },
];

interface MobileBottomNavProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu button - Opens existing MobileMenuDrawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Reuse existing MobileMenuDrawer - NO DUPLICATION */}
      <MobileMenuDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={user}
      />
    </>
  );
}
