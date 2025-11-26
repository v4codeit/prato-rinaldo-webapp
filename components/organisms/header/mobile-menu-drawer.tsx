'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import { signOut } from '@/app/actions/auth';

// Public navigation items
const publicNavItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Bacheca Pubblica', href: ROUTES.FEED },
  { label: 'Eventi', href: ROUTES.EVENTS },
  { label: 'Marketplace', href: ROUTES.MARKETPLACE },
];

// Private navigation items (verified users only)
const privateNavItems = [
  { label: 'Bacheca Privata', href: ROUTES.BACHECA },
  { label: 'Agorà', href: ROUTES.AGORA },
  { label: 'Risorse', href: ROUTES.RESOURCES },
  { label: 'Mio Condominio', href: ROUTES.MIO_CONDOMINIO },
  { label: 'Community Pro', href: ROUTES.COMMUNITY_PRO },
];

// Admin navigation items
const adminNavItems = [
  { label: 'Dashboard Admin', href: ROUTES.ADMIN },
  { label: 'Utenti', href: ROUTES.ADMIN_USERS },
  { label: 'Moderazione', href: ROUTES.ADMIN_MODERATION },
  { label: 'Articoli', href: ROUTES.ADMIN_ARTICLES },
  { label: 'Annunci', href: ROUTES.ADMIN_ANNOUNCEMENTS },
  { label: 'Impostazioni', href: ROUTES.ADMIN_SETTINGS },
];

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
}

export function MobileMenuDrawer({
  open,
  onOpenChange,
  user,
}: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = React.useState<'main' | 'admin'>('main');

  const isVerifiedResident = user?.verification_status === 'approved';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Combine nav items based on verification
  const mainNavItems = isVerifiedResident
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems;

  // Close drawer on route change
  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Reset view when drawer closes
  React.useEffect(() => {
    if (!open) {
      // Small delay to let close animation finish
      const timer = setTimeout(() => setCurrentView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const handleLogout = async () => {
    await signOut();
    // Hard refresh per pulire completamente lo stato (cache, React state, cookies)
    // onOpenChange(false) non serve più perché la pagina viene ricaricata
    window.location.href = '/';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>
            {currentView === 'main' ? 'Menu' : 'Amministrazione'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Menu di navigazione mobile
          </DrawerDescription>
        </DrawerHeader>

        {/* CRITICAL: Container with overflow-hidden for slide effect */}
        <div className="relative flex-1 overflow-hidden h-full min-h-0">
          {/* CRITICAL: Flex container with 200% width for two panels side-by-side */}
          <div
            className={cn(
              'flex h-full w-[200%] transition-transform duration-300 ease-in-out',
              currentView === 'main' ? 'translate-x-0' : '-translate-x-[50%]'
            )}
          >
            {/* MAIN MENU PANEL - 50% width of container (= 100% of visible area) */}
            <div className="w-1/2 flex-shrink-0 h-full">
              {/* CRITICAL: Native scroll with overflow-y-auto (NO ScrollArea component) */}
              <ScrollArea className="h-full px-4 pb-8">
                <nav className="flex flex-col space-y-1">
                  {/* Navigation Links */}
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href as any}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-lg transition-colors',
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}

                  {/* Admin Navigation Trigger */}
                  {isAdmin && (
                    <>
                      <div className="my-4 border-t" />
                      <button
                        onClick={() => setCurrentView('admin')}
                        className="flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors w-full"
                      >
                        <span>Amministrazione</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </>
                  )}

                  {/* Auth Section */}
                  <div className="my-4 border-t" />
                  {user ? (
                    <>
                      <Link
                        href={ROUTES.BACHECA as any}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg transition-colors',
                          pathname === ROUTES.BACHECA
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <User className="h-4 w-4" />
                        <span>Profilo & Badge</span>
                      </Link>
                      <Link
                        href={ROUTES.SETTINGS as any}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg transition-colors',
                          pathname === ROUTES.SETTINGS
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Impostazioni</span>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start px-4 py-3.5 h-auto text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Esci</span>
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={ROUTES.LOGIN as any} onClick={handleLinkClick}>
                          Accedi
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href={ROUTES.REGISTER as any} onClick={handleLinkClick}>
                          Registrati
                        </Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </ScrollArea>
            </div>

            {/* ADMIN MENU PANEL - 50% width of container (= 100% of visible area) */}
            <div className="w-1/2 flex-shrink-0 h-full">
              {/* CRITICAL: Native scroll with overflow-y-auto (NO ScrollArea component) */}
              <ScrollArea className="h-full px-4 pb-8">
                <nav className="flex flex-col space-y-1">
                  {/* Back button */}
                  <button
                    onClick={() => setCurrentView('main')}
                    className="flex items-center px-4 py-3.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors mb-2 w-full"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>Indietro</span>
                  </button>

                  <div className="border-t mb-2" />

                  {/* Admin nav items */}
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href as any}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center px-4 py-3.5 text-sm font-medium rounded-lg transition-colors',
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer >
  );
}
