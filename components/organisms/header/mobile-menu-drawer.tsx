'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Settings,
  LogOut,
  Vote,
  Users,
  Building,
  Newspaper,
  Shield,
  Megaphone,
  FileText,
  UserCog,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const adminNavItems = [
  { label: 'Dashboard', href: ROUTES.ADMIN, icon: Gauge },
  { label: 'Utenti', href: ROUTES.ADMIN_USERS, icon: UserCog },
  { label: 'Moderazione', href: ROUTES.ADMIN_MODERATION, icon: Shield },
  { label: 'Articoli', href: ROUTES.ADMIN_ARTICLES, icon: FileText },
  { label: 'Annunci', href: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Impostazioni', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
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
      <DrawerContent
        className="bg-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg font-bold text-slate-800">
            {currentView === 'main' ? 'Altro' : 'Amministrazione'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Menu di navigazione
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-1">
          {currentView === 'main' ? (
            <div className="animate-in fade-in duration-200">
              {/* Primary navigation items */}
              <DrawerLink
                icon={Vote}
                label="Agorà"
                description="Proposte civiche"
                href={ROUTES.AGORA}
                onClick={handleLinkClick}
                color="text-violet-600 bg-violet-50"
              />
              <DrawerLink
                icon={Users}
                label="Community Pro"
                description="Professionisti e volontari"
                href={ROUTES.COMMUNITY_PRO}
                onClick={handleLinkClick}
                color="text-blue-600 bg-blue-50"
              />
              <DrawerLink
                icon={Building}
                label="Mio Condominio"
                description="Gestione condominio"
                href={ROUTES.MIO_CONDOMINIO}
                onClick={handleLinkClick}
                color="text-amber-600 bg-amber-50"
              />
              <DrawerLink
                icon={Newspaper}
                label="Bacheca Pubblica"
                description="Feed della community"
                href={ROUTES.FEED}
                onClick={handleLinkClick}
                color="text-slate-600 bg-slate-50"
              />

              {/* Divider */}
              <div className="my-3 border-t border-slate-100" />

              {/* Settings */}
              <DrawerLink
                icon={Settings}
                label="Impostazioni"
                href={ROUTES.SETTINGS}
                onClick={handleLinkClick}
                color="text-slate-500 bg-slate-50"
              />

              {/* Admin */}
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-slate-700 flex-1 text-left">Amministrazione</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              )}

              {/* User section */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                {user ? (
                  <div className="flex items-center gap-3 px-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{user.name || 'Utente'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Esci"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 px-3">
                    <Button className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700" size="sm" asChild>
                      <Link href={ROUTES.LOGIN} onClick={handleLinkClick}>Accedi</Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" size="sm" asChild>
                      <Link href={ROUTES.REGISTER} onClick={handleLinkClick}>Registrati</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Admin View */
            <div className="animate-in fade-in slide-in-from-right-4 duration-200">
              <button
                onClick={() => setCurrentView('main')}
                className="flex items-center gap-1 mb-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Indietro
              </button>

              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 bg-slate-100">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerLink({
  icon: Icon,
  label,
  description,
  href,
  onClick,
  color,
}: {
  icon: any;
  label: string;
  description?: string;
  href: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <Link
      href={href as any}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-700 block">{label}</span>
        {description && (
          <span className="text-xs text-slate-400">{description}</span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </Link>
  );
}
