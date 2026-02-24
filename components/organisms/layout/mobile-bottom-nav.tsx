'use client';

import { useState } from 'react';
import { LayoutGrid, MessageSquare, Calendar, ShoppingBag, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import { MobileMenuDrawer } from '@/components/organisms/header/mobile-menu-drawer';

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

  const isBachecaActive = pathname.startsWith(ROUTES.BACHECA);
  const isCommunityActive = pathname.startsWith(ROUTES.COMMUNITY);
  const isEventsActive = pathname.startsWith(ROUTES.EVENTS);
  const isMercatinoActive = pathname.startsWith(ROUTES.MERCATINO);

  return (
    <>
      {/* Bottom Tab Bar - iOS-style with labels */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            <NavTab
              icon={LayoutGrid}
              label="Bacheca"
              active={isBachecaActive}
              href={ROUTES.BACHECA}
            />
            <NavTab
              icon={MessageSquare}
              label="Community"
              active={isCommunityActive}
              href={ROUTES.COMMUNITY}
            />
            <NavTab
              icon={Calendar}
              label="Eventi"
              active={isEventsActive}
              href={ROUTES.EVENTS}
            />
            <NavTab
              icon={ShoppingBag}
              label="Mercatino"
              active={isMercatinoActive}
              href={ROUTES.MERCATINO}
            />
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-lg transition-colors",
                drawerOpen
                  ? "text-teal-600"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-tight">Altro</span>
            </button>
          </div>
        </div>
      </div>

      <MobileMenuDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={user}
      />
    </>
  );
}

function NavTab({
  icon: Icon,
  label,
  active,
  href,
}: {
  icon: any;
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href as any}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 rounded-lg transition-colors",
        active
          ? "text-teal-600"
          : "text-slate-400 active:text-slate-600"
      )}
    >
      <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
      <span className={cn(
        "text-[10px] leading-tight",
        active ? "font-semibold" : "font-medium"
      )}>
        {label}
      </span>
    </Link>
  );
}
