'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MobileBottomNav } from '@/components/organisms/layout/mobile-bottom-nav';
import { UIProvider, useUI } from '@/lib/context/ui-context';
import { cn } from '@/lib/utils/cn';
import { AuthErrorHandler } from '@/components/organisms/auth/auth-error-handler';
import { useServiceWorkerMessages } from '@/hooks/use-service-worker-messages';
import { useSwipeBack } from '@/hooks/use-swipe-back';

interface MainLayoutClientProps {
  children: ReactNode;
  user: any;
  header: ReactNode;
}

function MainLayoutContent({ children, user, header }: MainLayoutClientProps) {
  const { isAnyFullscreen } = useUI();
  const pathname = usePathname();

  // Handle messages from Service Worker (fallback navigation for notification clicks)
  useServiceWorkerMessages();

  // Edge swipe-to-go-back navigation (disabled in fullscreen to avoid conflicts with chat gestures)
  useSwipeBack({ enabled: !isAnyFullscreen });

  // Hide nav on auth pages (login/register/etc) if they are wrapped by this layout
  // (though usually auth pages have their own layout, but just in case)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const showBottomNav = !isAnyFullscreen && !isAuthPage;

  return (
    <div className={cn(
      "bg-slate-50",
      // In fullscreen mode: no h-screen! da problemi, no overflow. Normal mode: min-height + bottom padding
      isAnyFullscreen ? "h-screen overflow-hidden" : "min-h-screen pb-16 md:pb-0"
    )}>
      {/* Header - Hidden in fullscreen mode (topic chat, etc.) */}
      {!isAnyFullscreen && header}

      <AuthErrorHandler />

      {/* Main Content */}
      <main className="transition-all duration-300">
        {children}
      </main>

      {/* Mobile Bottom Nav - Hidden in fullscreen mode */}
      {showBottomNav && <MobileBottomNav user={user} />}
    </div>
  );
}

export function MainLayoutClient(props: MainLayoutClientProps) {
  return (
    <UIProvider>
      <MainLayoutContent {...props} />
    </UIProvider>
  );
}
