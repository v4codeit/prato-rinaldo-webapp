'use client';

import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { AdminSubHeader } from '@/components/organisms/layout/admin-sub-header';

interface AdminLayoutClientProps {
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

// Map pathname to page title for admin pages
const getPageTitle = (pathname: string): { title: string; description?: string; section?: string } => {
  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return {
      title: 'Dashboard',
      description: 'Visualizza statistiche e metriche principali della piattaforma con accesso rapido alle sezioni di gestione'
    };
  }
  if (pathname.startsWith('/admin/users')) {
    return {
      title: 'Gestione Utenti',
      description: 'Visualizza e gestisci tutti gli utenti della piattaforma',
      section: 'users'
    };
  }
  if (pathname.startsWith('/admin/residents-map')) {
    return {
      title: 'Mappa Residenti',
      description: 'Visualizza la distribuzione dei residenti sulla mappa',
      section: 'residents-map'
    };
  }
  if (pathname.startsWith('/admin/moderation')) {
    return {
      title: 'Moderazione',
      description: 'Rivedi e approva i contenuti in attesa di moderazione dalla coda di revisione',
      section: 'moderation'
    };
  }
  if (pathname.startsWith('/admin/articles')) {
    return {
      title: 'Articoli',
      description: 'Gestione articoli e contenuti editoriali per la community (funzionalità in sviluppo)',
      section: 'articles'
    };
  }
  if (pathname.startsWith('/admin/announcements')) {
    return {
      title: 'Comunicazioni',
      description: 'Gestisci i banner e annunci mostrati nel mobile menu',
      section: 'announcements'
    };
  }
  if (pathname.startsWith('/admin/settings')) {
    return {
      title: 'Impostazioni',
      description: 'Gestisci le impostazioni generali, social e tenant',
      section: 'settings'
    };
  }
  return { title: 'Amministrazione', description: 'Area amministrativa' };
};

export function AdminLayoutClient({
  user,
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const { title, description, section } = getPageTitle(pathname);

  // Admin pages always have PageLayout (sidebar + sub-header enabled)
  return (
    <PageLayout
      user={user}
      subHeader={<AdminSubHeader title={title} description={description} section={section} />}
    >
      {children}
    </PageLayout>
  );
}
