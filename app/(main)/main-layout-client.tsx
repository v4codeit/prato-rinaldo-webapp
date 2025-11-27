'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';
import { MainContentTransition } from '@/components/organisms/layout/main-content-transition';
import { MainContentLoader } from '@/components/organisms/layout/main-content-loader';
import { AuthErrorHandler } from '@/components/organisms/auth/auth-error-handler';

interface MainLayoutClientProps {
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

/**
 * Unified page title mapping for all main routes
 * Merged from public-layout-client, private-layout-client, authenticated-layout-client
 */
const getPageTitle = (pathname: string): { title: string; description?: string } => {
  // Public routes
  if (pathname.startsWith('/feed')) return { title: 'Bacheca Pubblica', description: 'Rimani aggiornato sulle ultime novità della community' };
  if (pathname.startsWith('/events')) return { title: 'Eventi', description: 'Scopri tutti gli eventi della community' };
  if (pathname.startsWith('/marketplace')) return { title: 'Marketplace', description: 'Annunci e offerte della community' };
  if (pathname.startsWith('/articles')) return { title: 'Articoli', description: 'News e approfondimenti' };
  if (pathname.startsWith('/about')) return { title: 'Chi Siamo', description: 'Scopri la nostra community' };
  if (pathname.startsWith('/contacts')) return { title: 'Contatti' };
  if (pathname.startsWith('/privacy')) return { title: 'Privacy Policy' };
  if (pathname.startsWith('/terms')) return { title: 'Termini di Servizio' };
  if (pathname.startsWith('/statute')) return { title: 'Statuto' };

  // Private routes (verified users)
  if (pathname.startsWith('/bacheca')) return { title: 'Bacheca Privata', description: 'Discussioni riservate ai residenti verificati' };
  if (pathname.startsWith('/agora')) return { title: 'Agorà', description: 'Proposte e votazioni della community' };
  if (pathname.startsWith('/resources')) return { title: 'Risorse', description: 'Documenti e guide utili' };
  if (pathname.startsWith('/community-pro')) return { title: 'Community Pro', description: 'Professionisti del quartiere' };
  if (pathname.startsWith('/community')) return { title: 'Community', description: 'Chat in tempo reale' };
  if (pathname.startsWith('/messages')) return { title: 'Messaggi', description: 'Le tue conversazioni' };
  if (pathname.startsWith('/mio-condominio')) return { title: 'Mio Condominio', description: 'Gestione condominio' };

  // Authenticated routes
  if (pathname.startsWith('/profile')) return { title: 'Il Mio Profilo', description: 'Gestisci il tuo account e le tue preferenze' };
  if (pathname.startsWith('/settings')) return { title: 'Impostazioni', description: 'Configura il tuo account' };

  return { title: 'Prato Rinaldo' };
};

export function MainLayoutClient({
  user,
  children,
}: MainLayoutClientProps) {
  const pathname = usePathname();

  // Home page: no PageLayout (no sidebar/sub-header), but with transition
  if (pathname === '/') {
    return (
      <>
        {/* Auth error handler - shows dialog for expired/invalid links */}
        <AuthErrorHandler />
        <Suspense key={pathname} fallback={<MainContentLoader />}>
          <MainContentTransition>
            <main className="flex-1">{children}</main>
          </MainContentTransition>
        </Suspense>
      </>
    );
  }

  // Get page info from pathname
  const { title, description } = getPageTitle(pathname);

  // All other pages: with PageLayout (sidebar + sub-header enabled)
  return (
    <>
      {/* Auth error handler - shows dialog for expired/invalid links */}
      <AuthErrorHandler />
      <PageLayout
        user={user}
        subHeader={<PublicSubHeader title={title} description={description} />}
      >
        {children}
      </PageLayout>
    </>
  );
}
