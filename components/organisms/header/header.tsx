'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { Menu, X, User } from 'lucide-react';

// Public navigation items (visible to all)
const publicNavItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Eventi', href: ROUTES.EVENTS },
  { label: 'Marketplace', href: ROUTES.MARKETPLACE },
  { label: 'Community Pro', href: ROUTES.COMMUNITY_PRO },
];

// Private navigation items (only for authenticated users)
const privateNavItems = [
  { label: 'Agorà', href: ROUTES.AGORA },
  { label: 'Risorse', href: ROUTES.RESOURCES },
];

interface HeaderProps {
  user?: {
    id: string;
    name?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Combine nav items based on auth status
  const navItems = user
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems;

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <Link href={ROUTES.PROFILE}>
                  <User className="h-4 w-4 mr-2" />
                  Profilo
                </Link>
              </Button>
            </>
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary px-4 py-2',
                  pathname === item.href
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary/10 hover:text-primary hover:border-primary"
                  asChild
                >
                  <Link href={ROUTES.PROFILE}>
                    <User className="h-4 w-4 mr-2" />
                    Profilo
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary"
                    asChild
                  >
                    <Link href={ROUTES.LOGIN}>Accedi</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href={ROUTES.REGISTER}>Registrati</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
