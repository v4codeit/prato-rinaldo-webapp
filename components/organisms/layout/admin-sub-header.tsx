'use client';

import { ReactNode } from 'react';
import { SubHeader, BreadcrumbItem } from './sub-header';
import { ROUTES } from '@/lib/utils/constants';

interface AdminSubHeaderProps {
  title: string;
  description?: string;
  section?: string; // es: 'users', 'moderation', etc
  actions?: ReactNode;
  children?: ReactNode;
}

export function AdminSubHeader({
  title,
  description,
  section,
  actions,
  children
}: AdminSubHeaderProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: ROUTES.ADMIN },
  ];

  // Aggiungi il title come ultimo breadcrumb (sarà renderizzato come H1)
  breadcrumbs.push({ label: title });

  return (
    <SubHeader
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      {children}
    </SubHeader>
  );
}
