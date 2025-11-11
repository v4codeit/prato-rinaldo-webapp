'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';
import { MainContentTransition } from '@/components/organisms/layout/main-content-transition';
import { MainContentLoader } from '@/components/organisms/layout/main-content-loader';

interface PublicLayoutClientProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
  children: React.ReactNode;
}

// Map pathname to page title
const getPageTitle = (pathname: string): { title: string; description?: string } => {
  if (pathname.startsWith('/feed')) return { title: 'Bacheca Pubblica', description: 'Rimani aggiornato sulle ultime novità della community' };
  if (pathname.startsWith('/events')) return { title: 'Eventi', description: 'Scopri tutti gli eventi della community' };
  if (pathname.startsWith('/marketplace')) return { title: 'Marketplace', description: 'Annunci e offerte della community' };
  if (pathname.startsWith('/about')) return { title: 'Chi Siamo', description: 'Scopri la nostra community' };
  if (pathname.startsWith('/contacts')) return { title: 'Contatti' };
  if (pathname.startsWith('/privacy')) return { title: 'Privacy Policy' };
  if (pathname.startsWith('/terms')) return { title: 'Termini di Servizio' };
  if (pathname.startsWith('/statute')) return { title: 'Statuto' };
  if (pathname.startsWith('/community')) return { title: 'La Community' };
  return { title: 'Prato Rinaldo' };
};

export function PublicLayoutClient({
  user,
  children,
}: PublicLayoutClientProps) {
  const pathname = usePathname();

  // Home page: no PageLayout (no sidebar/sub-header), but with transition
  if (pathname === '/') {
    return (
      <Suspense key={pathname} fallback={<MainContentLoader />}>
        <MainContentTransition>
          <main className="flex-1">{children}</main>
        </MainContentTransition>
      </Suspense>
    );
  }

  // Get page info from pathname
  const { title, description } = getPageTitle(pathname);

  // Other public pages: with PageLayout (sidebar + sub-header enabled)
  return (
    <PageLayout
      user={user}
      subHeader={<PublicSubHeader title={title} description={description} />}
    >
      {children}
    </PageLayout>
  );
}
