'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Megaphone,
  MessageCircle,
  MapPin,
  Settings
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { SimpleSidebarMenuButton } from './simple-sidebar-menu-button';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

const adminMenuItems = [
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN,
    icon: LayoutDashboard,
  },
  {
    label: 'Gestione Utenti',
    href: ROUTES.ADMIN_USERS,
    icon: Users,
  },
  {
    label: 'Mappa Residenti',
    href: ROUTES.ADMIN_RESIDENTS_MAP,
    icon: MapPin,
  },
  {
    label: 'Moderazione',
    href: ROUTES.ADMIN_MODERATION,
    icon: Shield,
  },
  {
    label: 'Community',
    href: ROUTES.ADMIN_COMMUNITY,
    icon: MessageCircle,
  },
  {
    label: 'Articoli',
    href: ROUTES.ADMIN_ARTICLES,
    icon: FileText,
  },
  {
    label: 'Comunicazioni',
    href: ROUTES.ADMIN_ANNOUNCEMENTS,
    icon: Megaphone,
  },
  {
    label: 'Impostazioni',
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
  },
] as const;

export function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {adminMenuItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.href}>
            <SimpleSidebarMenuButton asChild isActive={isActive}>
              <Link href={item.href as Route}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SimpleSidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
