'use client';

import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';

interface AuthenticatedLayoutClientProps {
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

// Map pathname to page title for authenticated pages
const getPageTitle = (pathname: string): { title: string; description?: string } => {
  if (pathname.startsWith('/profile')) return { title: 'Il Mio Profilo', description: 'Gestisci il tuo account e le tue preferenze' };
  if (pathname.startsWith('/settings')) return { title: 'Impostazioni', description: 'Configura il tuo account' };
  return { title: 'Profilo' };
};

export function AuthenticatedLayoutClient({
  user,
  children,
}: AuthenticatedLayoutClientProps) {
  const pathname = usePathname();
  const { title, description } = getPageTitle(pathname);

  // Authenticated pages always have PageLayout (sidebar + sub-header enabled)
  return (
    <PageLayout
      user={user}
      subHeader={<PublicSubHeader title={title} description={description} />}
    >
      {children}
    </PageLayout>
  );
}
