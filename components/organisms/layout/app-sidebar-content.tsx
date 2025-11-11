'use client';

import { usePathname } from 'next/navigation';
import { SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { AdminSidebarContent } from './admin-sidebar-content';
import { PublicSidebarContent } from './public-sidebar-content';

interface AppSidebarContentProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
  children?: React.ReactNode; // Per filtri dinamici specifici per pagina
}

export function AppSidebarContent({ user, children }: AppSidebarContentProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="flex h-full flex-col">
      <SidebarContent className="flex-1 overflow-auto p-2 pt-6">
        {isAdminRoute ? (
          <AdminSidebarContent />
        ) : (
          <PublicSidebarContent user={user}>
            {children}
          </PublicSidebarContent>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-6">
        <p className="text-xs text-muted-foreground">
          Community Prato Rinaldo
        </p>
      </SidebarFooter>
    </div>
  );
}
