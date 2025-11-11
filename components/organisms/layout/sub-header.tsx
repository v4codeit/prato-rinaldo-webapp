'use client';

import { ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SubHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children?: ReactNode;
}

export function SubHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children
}: SubHeaderProps) {
  // Se breadcrumbs non forniti, creare automaticamente con solo il title
  const finalBreadcrumbs = breadcrumbs || [{ label: title }];

  return (
    <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Breadcrumb/Title Combinati + Actions */}
      <div className="container py-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb con ultimo elemento come H1 Title */}
          <Breadcrumb>
            <BreadcrumbList>
              {finalBreadcrumbs.map((item, index) => {
                const isLast = index === finalBreadcrumbs.length - 1;

                return (
                  <div key={index} className="flex items-center">
                    <BreadcrumbItem>
                      {isLast ? (
                        // Ultimo elemento = Title H1
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                          {item.label}
                        </h1>
                      ) : item.href ? (
                        <BreadcrumbLink href={item.href} className="text-sm">
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </div>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Description sotto breadcrumb/title */}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Actions allineati a destra */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Optional children (tabs, filters, etc) */}
      {children && (
        <div className="container pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
