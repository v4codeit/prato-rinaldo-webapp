'use client';

import { useState } from 'react';
import { LayoutGrid, MessageSquare, Building, User, Plus } from 'lucide-react';
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

  // Determine active state for navigation items
  const isBachecaActive = pathname.startsWith(ROUTES.BACHECA);
  const isCommunityActive = pathname.startsWith(ROUTES.COMMUNITY);
  const isCondoActive = pathname.startsWith(ROUTES.MIO_CONDOMINIO);
  const isSettingsActive = pathname.startsWith(ROUTES.SETTINGS) || pathname.startsWith('/profile');

  return (
    <>
      {/* Dark Pill Bottom Navigation - Floating */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl shadow-slate-900/20 flex justify-between items-center px-6">

          {/* Bacheca */}
          <NavButton
            icon={LayoutGrid}
            active={isBachecaActive}
            href={ROUTES.BACHECA}
          />

          {/* Community */}
          <NavButton
            icon={MessageSquare}
            active={isCommunityActive}
            href={ROUTES.COMMUNITY}
          />

          {/* Central Plus Button - Toggles Menu */}
          <div className="-mt-8">
            <button
              className="h-14 w-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              onClick={() => setDrawerOpen(true)}
            >
              <Plus className={`h-8 w-8 transition-transform duration-300 ${drawerOpen ? "rotate-45" : ""}`} />
            </button>
          </div>

          {/* Condo (or Community Pro/Events depending on preference, sticking to plan: Condo) */}
          <NavButton
            icon={Building}
            active={isCondoActive}
            href={ROUTES.MIO_CONDOMINIO}
          />

          {/* Settings/Profile */}
          <NavButton
            icon={User}
            active={isSettingsActive}
            href={ROUTES.SETTINGS}
          />
        </div>
      </div>

      {/* Fullscreen Menu Overlay */}
      <MobileMenuDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={user}
      />
    </>
  );
}

function NavButton({ icon: Icon, active, href }: { icon: any, active: boolean, href: string }) {
  return (
    <Link
      href={href as any}
      className={cn(
        "p-3 rounded-xl transition-all",
        active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={2} />
    </Link>
  );
}
