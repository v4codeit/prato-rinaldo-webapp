import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { Menu, X, Home, Calendar, ShoppingBag, Users, BookOpen, MessageSquare, Trophy, User } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const publicNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/eventi", label: "Eventi", icon: Calendar },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  ];

  const privateNavItems = [
    { href: "/profilo", label: "Profilo", icon: User },
    { href: "/professionisti", label: "Professionisti", icon: Users },
    { href: "/risorse", label: "Risorse", icon: BookOpen },
    { href: "/forum", label: "Forum", icon: MessageSquare },
  ];

  const navItems = isAuthenticated && user?.verificationStatus === 'approved' 
    ? privateNavItems 
    : publicNavItems;

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo *        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          {APP_LOGO && (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 object-contain" />
          )}
          <span className="font-bold text-xl bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            {APP_TITLE}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(item.href)
                    ? "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu / Login Button */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {user.verificationStatus === 'pending' && (
                <span className="hidden sm:inline-block text-sm text-warning mr-2">
                  In attesa di verifica
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profilo" className="w-full cursor-pointer">Profilo</Link>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer">Amministrazione</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.href)
                      ? "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

