import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/**
 * Action button for page header
 */
export interface PageAction {
  /** Button label */
  label: string;
  /** Button href (for Link) */
  href?: string;
  /** Button click handler (for Button) */
  onClick?: () => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /** Button icon */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * AdminPageLayout props
 */
export interface AdminPageLayoutProps {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Action buttons for the header */
  actions?: PageAction[];
  /** Back link configuration */
  backLink?: {
    href: string;
    label?: string;
  };
  /** Main content */
  children: React.ReactNode;
  /** Custom className for container */
  className?: string;
  /** Reduce top padding (useful when used inside layouts with padding) */
  reducedPadding?: boolean;
  /** Custom header content (replaces title/description) */
  header?: React.ReactNode;
}

/**
 * Consistent layout wrapper for admin pages
 *
 * Provides:
 * - Consistent container and padding
 * - Optional page header with title, description, and action buttons
 * - Optional back navigation
 *
 * @example
 * ```tsx
 * <AdminPageLayout
 *   title="Gestione Utenti"
 *   description="Visualizza e gestisci tutti gli utenti"
 *   actions={[
 *     {
 *       label: 'Nuovo Utente',
 *       href: '/admin/users/new',
 *       icon: Plus
 *     }
 *   ]}
 *   backLink={{ href: '/admin', label: 'Dashboard' }}
 * >
 *   <UserTable />
 * </AdminPageLayout>
 * ```
 */
export function AdminPageLayout({
  title,
  description,
  actions,
  backLink,
  children,
  className,
  reducedPadding,
  header,
}: AdminPageLayoutProps) {
  const hasHeader = title || description || actions || backLink || header;

  return (
    <div className={cn('container', reducedPadding ? 'py-4' : 'py-8', className)}>
      {/* Page Header */}
      {hasHeader && (
        <div className="mb-6 md:mb-8">
          {/* Back Link */}
          {backLink && (
            <div className="mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={backLink.href as any}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {backLink.label || 'Indietro'}
                </Link>
              </Button>
            </div>
          )}

          {/* Custom Header or Actions */}
          {header ? (
            header
          ) : (
            <>
              {/* Actions */}
              {actions && actions.length > 0 && (
                <div className="flex justify-end">
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action, index) => {
                      const Icon = action.icon;
                      const buttonContent = (
                        <>
                          {Icon && <Icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </>
                      );

                      if (action.href) {
                        return (
                          <Button
                            key={index}
                            variant={action.variant || 'default'}
                            asChild
                          >
                            <Link href={action.href as any}>{buttonContent}</Link>
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={index}
                          variant={action.variant || 'default'}
                          onClick={action.onClick}
                        >
                          {buttonContent}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
}
