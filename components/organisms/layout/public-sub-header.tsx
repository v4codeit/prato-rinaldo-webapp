'use client';

import { ReactNode } from 'react';
import { SubHeader, BreadcrumbItem } from './sub-header';

interface PublicSubHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[]; // Custom breadcrumbs o usa default
  actions?: ReactNode;
  children?: ReactNode;
}

export function PublicSubHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children
}: PublicSubHeaderProps) {
  // Default breadcrumbs se non forniti
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: title },
  ];

  return (
    <SubHeader
      title={title}
      description={description}
      breadcrumbs={breadcrumbs || defaultBreadcrumbs}
      actions={actions}
    >
      {children}
    </SubHeader>
  );
}
