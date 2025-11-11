'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/utils/constants';
import {
  User,
  LogOut,
  Settings,
  MessageSquare,
  Landmark,
  BookOpen,
  Users,
  Shield
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { getShortName, getInitials } from '@/lib/utils/format';

interface UserAvatarDropdownProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  };
}

export function UserAvatarDropdown({ user }: UserAvatarDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Check permissions
  const isVerified = user.verification_status === 'approved';
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  // Get initials for fallback
  const initials = getInitials(user.name || 'User');

  // Private navigation items (only for verified)
  const privateNavItems = isVerified ? [
    { label: 'Bacheca Privata', href: ROUTES.BACHECA, icon: MessageSquare },
    { label: 'Agorà', href: ROUTES.AGORA, icon: Landmark },
    { label: 'Risorse', href: ROUTES.RESOURCES, icon: BookOpen },
    { label: 'Community Pro', href: ROUTES.COMMUNITY_PRO, icon: Users },
  ] : [];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block font-medium">
            {getShortName(user.name || user.email || '')}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Profile */}
        <DropdownMenuItem asChild>
          <Link href={ROUTES.BACHECA} className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Profilo & Badge</span>
          </Link>
        </DropdownMenuItem>

        {/* Private Links (Verified only) */}
        {privateNavItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {privateNavItems.map(item => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Admin Dashboard */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.ADMIN} className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                <span>Dashboard Admin</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Admin
                </Badge>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* Settings */}
        <DropdownMenuItem asChild>
          <Link href={ROUTES.SETTINGS} className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>Impostazioni</span>
          </Link>
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Esci</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
