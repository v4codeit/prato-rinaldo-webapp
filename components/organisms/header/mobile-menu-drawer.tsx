'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, User, Settings, LogOut, Calendar, ShoppingBag, Vote, MessageSquare, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import { signOut } from '@/app/actions/auth';

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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Close drawer on route change
  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Reset view when drawer closes
  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setCurrentView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-slate-50/95 backdrop-blur-xl">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-2xl font-bold text-slate-800">
            {currentView === 'main' ? 'Menu' : 'Amministrazione'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Menu di navigazione mobile
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-20">
          {currentView === 'main' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Main Grid Navigation */}
              <div className="grid grid-cols-2 gap-4">
                <MenuCard
                  icon={Calendar}
                  label="Eventi"
                  color="bg-orange-100 text-orange-600"
                  href={ROUTES.EVENTS}
                  onClick={handleLinkClick}
                />
                <MenuCard
                  icon={ShoppingBag}
                  label="Mercatino"
                  color="bg-emerald-100 text-emerald-600"
                  href={ROUTES.MARKETPLACE}
                  onClick={handleLinkClick}
                />
                <MenuCard
                  icon={Vote}
                  label="Agora"
                  color="bg-violet-100 text-violet-600"
                  href={ROUTES.AGORA}
                  onClick={handleLinkClick}
                />
                <MenuCard
                  icon={MessageSquare}
                  label="Community"
                  color="bg-blue-100 text-blue-600"
                  href={ROUTES.COMMUNITY_PRO} // Or ROUTES.COMMUNITY if ready
                  onClick={handleLinkClick}
                />
              </div>

              {/* Secondary Links */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-2">Altro</h3>
                <div className="bg-white rounded-2xl p-2 shadow-sm border">
                  <Link
                    href={ROUTES.FEED}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-700">Bacheca Pubblica</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Link>

                  {/* Admin Trigger */}
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <Settings className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-700">Amministrazione</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* User / Auth Section */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                        {user.name?.[0] || user.email?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name || 'Utente'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-xl" asChild>
                        <Link href={ROUTES.SETTINGS} onClick={handleLinkClick}>Profilo</Link>
                      </Button>
                      <Button variant="destructive" className="rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={handleLogout}>
                        Esci
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-slate-500 mb-2">Accedi per partecipare alla community</p>
                    <Button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700" asChild>
                      <Link href={ROUTES.LOGIN} onClick={handleLinkClick}>Accedi</Link>
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl" asChild>
                      <Link href={ROUTES.REGISTER} onClick={handleLinkClick}>Registrati</Link>
                    </Button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Admin View */
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('main')}
                className="mb-2 pl-0 hover:bg-transparent text-slate-600"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Torna al Menu
              </Button>

              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border">
                {adminNavItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors",
                      index !== adminNavItems.length - 1 && "border-b border-slate-100"
                    )}
                  >
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white/50">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full rounded-full">Chiudi</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer >
  );
}

function MenuCard({ icon: Icon, label, color, href, onClick }: { icon: any, label: string, color: string, href: string, onClick: () => void }) {
  return (
    <Link
      href={href as any}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white border shadow-sm hover:shadow-md transition-all active:scale-95"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-bold text-slate-700">{label}</span>
    </Link>
  );
}
