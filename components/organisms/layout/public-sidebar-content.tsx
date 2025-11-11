'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  ShoppingBag,
  Landmark,
  BookOpen,
  Users,
  Building2
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { SimpleSidebarMenuButton } from './simple-sidebar-menu-button';
import { ROUTES } from '@/lib/utils/constants';

const publicMenuItems = [
  {
    label: 'Bacheca Pubblica',
    href: ROUTES.FEED,
    icon: MessageSquare,
  },
  {
    label: 'Eventi',
    href: ROUTES.EVENTS,
    icon: Calendar,
  },
  {
    label: 'Articoli',
    href: ROUTES.ARTICLES,
    icon: BookOpen,
  },
  {
    label: 'Marketplace',
    href: ROUTES.MARKETPLACE,
    icon: ShoppingBag,
  },
] as const;

const privateMenuItems = [
  {
    label: 'Bacheca Privata',
    href: ROUTES.BACHECA,
    icon: MessageSquare,
  },
  {
    label: 'Agorà',
    href: ROUTES.AGORA,
    icon: Landmark,
  },
  {
    label: 'Risorse',
    href: ROUTES.RESOURCES,
    icon: BookOpen,
  },
  {
    label: 'Mio Condominio',
    href: ROUTES.MIO_CONDOMINIO,
    icon: Building2,
  },
  {
    label: 'Community Pro',
    href: ROUTES.COMMUNITY_PRO,
    icon: Users,
  },
];

interface PublicSidebarContentProps {
  user?: {
    id: string;
    verification_status?: string;
  } | null;
  children?: React.ReactNode; // Slot per filtri dinamici
}

export function PublicSidebarContent({ user, children }: PublicSidebarContentProps) {
  const pathname = usePathname();
  const isVerified = user?.verification_status === 'approved';

  return (
    <>
      {/* Sezione Menu Pubblico */}
      <SidebarGroup>
        <SidebarGroupLabel>Esplora</SidebarGroupLabel>
        <SidebarMenu>
          {publicMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SimpleSidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href as any}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SimpleSidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      {/* Sezione Community (solo verified) */}
      {isVerified && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Community</SidebarGroupLabel>
            <SidebarMenu>
              {privateMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SimpleSidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href as any}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SimpleSidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}

      {/* Slot per filtri dinamici */}
      {children && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
            {children}
          </SidebarGroup>
        </>
      )}
    </>
  );
}
