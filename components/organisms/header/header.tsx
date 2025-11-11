'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { UserAvatarDropdown } from '@/components/molecules/user-avatar-dropdown';
import { MobileHeaderContent } from './mobile-header-content';

// Public navigation items (visible to all - visitors)
const publicNavItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Bacheca Pubblica', href: ROUTES.FEED },
  { label: 'Eventi', href: ROUTES.EVENTS },
  { label: 'Articoli', href: ROUTES.ARTICLES },
  { label: 'Marketplace', href: ROUTES.MARKETPLACE },
] as const;

interface HeaderProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center space-x-3">
          <Image
            src="/assets/logos/logo-pratorinaldo.png"
            alt={APP_NAME}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="text-xl font-bold">{APP_NAME}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons / Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <UserAvatarDropdown user={user} />
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary"
                >
                  <Link href={ROUTES.LOGIN}>Accedi</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={ROUTES.REGISTER}>Registrati</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu (ONLY homepage) */}
          {pathname === '/' && <MobileHeaderContent user={user} />}
        </div>
      </div>
    </header>
  );
}
