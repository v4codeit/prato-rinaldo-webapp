'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Column definition for DataTable
 */
export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode;
  /** Access nested object properties (e.g., 'user.name') */
  accessor?: (item: T) => any;
  /** Custom className for the column */
  className?: string;
  /** Hide column on mobile */
  hiddenOnMobile?: boolean;
}

/**
 * Row action for DataTable
 */
export interface DataTableRowAction<T> {
  /** Action label */
  label: string;
  /** Action icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action handler */
  onClick: (item: T) => void | Promise<void>;
  /** Action variant (affects styling) */
  variant?: 'default' | 'destructive';
  /** Show action as disabled */
  disabled?: (item: T) => boolean;
}

/**
 * Pagination configuration
 */
export interface DataTablePagination {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
}

/**
 * Generic DataTable Props
 */
export interface DataTableProps<T> {
  /** Array of data items */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row actions (shown in dropdown menu) */
  rowActions?: DataTableRowAction<T>[];
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Pagination configuration */
  pagination?: DataTablePagination;
  /** Custom className for table container */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Get unique key for each row */
  getRowKey?: (item: T) => string;
}

/**
 * Generic, reusable DataTable component for admin panels
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: 'name', header: 'Nome', accessor: (u) => u.name },
 *     { key: 'email', header: 'Email', accessor: (u) => u.email },
 *     {
 *       key: 'status',
 *       header: 'Stato',
 *       render: (u) => <Badge>{u.status}</Badge>
 *     }
 *   ]}
 *   rowActions={[
 *     {
 *       label: 'Modifica',
 *       icon: Edit,
 *       onClick: (user) => handleEdit(user)
 *     },
 *     {
 *       label: 'Elimina',
 *       icon: Trash,
 *       onClick: (user) => handleDelete(user),
 *       variant: 'destructive'
 *     }
 *   ]}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowActions,
  emptyMessage = 'Nessun dato disponibile',
  pagination,
  className,
  isLoading,
  getRowKey,
}: DataTableProps<T>) {
  // Default row key getter
  const defaultGetRowKey = React.useCallback(
    (item: T, index: number) => {
      if (getRowKey) return getRowKey(item);
      if ('id' in item) return String(item.id);
      return String(index);
    },
    [getRowKey]
  );

  // Render cell content
  const renderCell = React.useCallback(
    (item: T, column: DataTableColumn<T>) => {
      if (column.render) {
        return column.render(item);
      }
      if (column.accessor) {
        return column.accessor(item);
      }
      return item[column.key];
    },
    []
  );

  // Empty state
  if (!isLoading && data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  // Calculate pagination
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;
  const showPagination = pagination && totalPages > 1;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    column.hiddenOnMobile && 'hidden md:table-cell'
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableHead className="w-[70px]">
                  <span className="sr-only">Azioni</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="h-24 text-center"
                >
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={defaultGetRowKey(item, index)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.className,
                        column.hiddenOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <span className="sr-only">Apri menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action, actionIndex) => {
                            const Icon = action.icon;
                            const isDisabled = action.disabled?.(item) ?? false;

                            return (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => !isDisabled && action.onClick(item)}
                                disabled={isDisabled}
                                className={cn(
                                  action.variant === 'destructive' &&
                                    'text-destructive focus:text-destructive'
                                )}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} di{' '}
            {pagination.total} risultati
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Precedente
            </Button>
            <div className="text-sm">
              Pagina {pagination.page} di {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Successiva
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
