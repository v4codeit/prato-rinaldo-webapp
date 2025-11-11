'use client';

import { ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebarContent } from './app-sidebar-content';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MainContentTransition } from './main-content-transition';
import { MainContentLoader } from './main-content-loader';

interface PageLayoutProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
  children: ReactNode;
  sidebarChildren?: ReactNode; // Per filtri dinamici specifici per pagina
  subHeader?: ReactNode; // SubHeader component (title, breadcrumb, actions)
}

export function PageLayout({ user, children, sidebarChildren, subHeader }: PageLayoutProps) {
  const pathname = usePathname();

  return (
    <>
      {/* SubHeader: Full-width across entire page - ALWAYS VISIBLE */}
      {subHeader}

      {/* Desktop Layout: Flex Container con Sidebar Sticky + Main Content */}
      <div className="flex gap-6 flex-1 pb-16 md:pb-0">
        {/* Desktop: Sticky Sidebar - ALWAYS VISIBLE */}
        <aside className="hidden md:block sticky top-32 mt-6 mb-auto self-start w-72 p-4 max-h-[calc(100vh-8rem)]">
          <div className="h-full w-full overflow-y-auto rounded-xl bg-accent border shadow-lg">
            <AppSidebarContent user={user}>
              {sidebarChildren}
            </AppSidebarContent>
          </div>
        </aside>

        {/* Main Content Area - TRANSITION TARGET */}
        <div className="flex-1 min-w-0">
          <Suspense key={pathname} fallback={<MainContentLoader />}>
            <MainContentTransition>
              <main className="flex-1">
                {children}
              </main>
            </MainContentTransition>
          </Suspense>
        </div>
      </div>

      {/* Mobile Bottom Navigation - ALWAYS VISIBLE */}
      <MobileBottomNav user={user} />
    </>
  );
}
