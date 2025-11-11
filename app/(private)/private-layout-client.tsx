'use client';

import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';

interface PrivateLayoutClientProps {
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

// Map pathname to page title for private pages
const getPageTitle = (pathname: string): { title: string; description?: string } => {
  if (pathname.startsWith('/bacheca')) return { title: 'Bacheca Privata', description: 'Discussioni riservate ai residenti verificati' };
  if (pathname.startsWith('/agora')) return { title: 'Agorà', description: 'Proposte e votazioni della community' };
  if (pathname.startsWith('/resources')) return { title: 'Risorse', description: 'Documenti e guide utili' };
  if (pathname.startsWith('/community-pro')) return { title: 'Community Pro', description: 'Professionisti del quartiere' };
  return { title: 'Community' };
};

export function PrivateLayoutClient({
  user,
  children,
}: PrivateLayoutClientProps) {
  const pathname = usePathname();
  const { title, description } = getPageTitle(pathname);

  // Private pages always have PageLayout (sidebar + sub-header enabled)
  return (
    <PageLayout
      user={user}
      subHeader={<PublicSubHeader title={title} description={description} />}
    >
      {children}
    </PageLayout>
  );
}
