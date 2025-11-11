# BOTTOM NAVBAR - CODE EXAMPLES

## FILE 1: hooks/use-mobile-navigation.ts

import { create } from 'zustand';

interface MobileNavigationStore {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useMobileNavigation = create<MobileNavigationStore>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));

---

## FILE 2: lib/navigation/mobile-navigation-config.ts

import { Home, Newspaper, Calendar, Star } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const bottomNavItems: NavItem[] = [
  { id: 'home', label: 'Home', href: ROUTES.HOME, icon: Home },
  { id: 'feed', label: 'Bacheca', href: ROUTES.FEED, icon: Newspaper },
  { id: 'events', label: 'Eventi', href: ROUTES.EVENTS, icon: Calendar },
  { id: 'community', label: 'Community', href: ROUTES.COMMUNITY_PRO, icon: Star },
];

---

## FILE 3: components/organisms/bottom-navbar/bottom-navbar.tsx

'use client';

import { usePathname } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { BottomNavbarItem } from './bottom-navbar-item';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { bottomNavItems } from '@/lib/navigation/mobile-navigation-config';
import { cn } from '@/lib/utils/cn';

interface BottomNavbarProps {
  user?: any | null;
}

export function BottomNavbar({ user }: BottomNavbarProps) {
  const pathname = usePathname();
  const { openDrawer } = useMobileNavigation();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40 md:hidden',
      'border-t bg-background/95 backdrop-blur'
    )}>
      <div className='flex items-center justify-around h-20'>
        {bottomNavItems.map((item) => (
          <BottomNavbarItem
            key={item.id}
            item={item}
            isActive={pathname === item.href}
          />
        ))}

        <button
          onClick={openDrawer}
          className='flex flex-col items-center justify-center gap-1 px-4 py-2'
          aria-label='Open menu'
        >
          <MoreVertical className='h-6 w-6' />
        </button>
      </div>
    </nav>
  );
}

---

## FILE 4: components/organisms/bottom-navbar/bottom-navbar-item.tsx

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { NavItem } from '@/lib/navigation/mobile-navigation-config';

interface BottomNavbarItemProps {
  item: NavItem;
  isActive: boolean;
}

export function BottomNavbarItem({ item, isActive }: BottomNavbarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-4 py-2 relative',
        'text-muted-foreground hover:text-foreground transition-colors',
        isActive && 'text-primary'
      )}
      title={item.label}
    >
      <Icon className='h-6 w-6' />
      {isActive && <div className='absolute bottom-0 left-0 right-0 h-1 bg-primary' />}
    </Link>
  );
}

---

## FILE 5: Layout Integration Example

// app/(public)/layout.tsx

import { BottomNavbar } from '@/components/organisms/bottom-navbar/bottom-navbar';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userWithVerification = /* ... */;

  return (
    <div className='flex min-h-screen flex-col'>
      <Header user={userWithVerification} />
      <main className='flex-1 pb-20 md:pb-0'>
        <PublicLayoutClient user={userWithVerification}>
          {children}
        </PublicLayoutClient>
      </main>
      <Footer />
      <BottomNavbar user={userWithVerification} />
    </div>
  );
}
