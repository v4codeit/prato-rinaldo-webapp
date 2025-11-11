'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Bulk action definition
 */
export interface BulkAction {
  /** Unique key for the action */
  key: string;
  /** Action label */
  label: string;
  /** Action icon */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action handler (receives array of selected item IDs) */
  onAction: (selectedIds: string[]) => void | Promise<void>;
  /** Action variant (affects styling) */
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  /** Show confirmation dialog before executing */
  requireConfirmation?: boolean;
  /** Confirmation dialog title */
  confirmationTitle?: string;
  /** Confirmation dialog description */
  confirmationDescription?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * BulkActionsToolbar props
 */
export interface BulkActionsToolbarProps {
  /** Array of selected item IDs */
  selectedIds: string[];
  /** Total number of items available for selection */
  totalItems: number;
  /** Available bulk actions */
  actions: BulkAction[];
  /** Clear selection handler */
  onClearSelection: () => void;
  /** Custom className */
  className?: string;
  /** Sticky position (stays visible when scrolling) */
  sticky?: boolean;
  /** Custom label for selected count */
  selectedLabel?: string;
}

/**
 * Toolbar component for performing bulk actions on selected items
 *
 * Features:
 * - Shows selected count
 * - Supports multiple actions with custom handlers
 * - Optional confirmation dialogs for destructive actions
 * - Sticky positioning option
 * - Clear selection functionality
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedIds={selectedUserIds}
 *   totalItems={users.length}
 *   actions={[
 *     {
 *       key: 'delete',
 *       label: 'Elimina',
 *       icon: Trash,
 *       variant: 'destructive',
 *       requireConfirmation: true,
 *       confirmationTitle: 'Conferma eliminazione',
 *       confirmationDescription: 'Vuoi eliminare gli utenti selezionati?',
 *       onAction: async (ids) => {
 *         await deleteUsers(ids);
 *         toast.success('Utenti eliminati');
 *       }
 *     },
 *     {
 *       key: 'activate',
 *       label: 'Attiva',
 *       icon: Check,
 *       onAction: async (ids) => {
 *         await activateUsers(ids);
 *       }
 *     }
 *   ]}
 *   onClearSelection={() => setSelectedUserIds([])}
 * />
 * ```
 */
export function BulkActionsToolbar({
  selectedIds,
  totalItems,
  actions,
  onClearSelection,
  className,
  sticky = true,
  selectedLabel = 'selezionati',
}: BulkActionsToolbarProps) {
  const [pendingAction, setPendingAction] = React.useState<BulkAction | null>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);

  // Don't render if no items are selected
  if (selectedIds.length === 0) {
    return null;
  }

  // Handle action click
  const handleActionClick = (action: BulkAction) => {
    if (action.requireConfirmation) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  };

  // Execute action
  const executeAction = async (action: BulkAction) => {
    try {
      setIsExecuting(true);
      await action.onAction(selectedIds);
      onClearSelection();
      setPendingAction(null);
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setPendingAction(null);
  };

  // Confirm action
  const handleConfirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div
        className={cn(
          'flex items-center gap-4 p-4 bg-muted/50 border rounded-lg',
          sticky && 'sticky top-4 z-10',
          className
        )}
      >
        {/* Selection Info */}
        <div className="flex items-center gap-2 flex-1">
          <Badge variant="secondary" className="font-semibold">
            {selectedIds.length} {selectedLabel}
          </Badge>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            su {totalItems} totali
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                variant={action.variant || 'default'}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={action.disabled || isExecuting}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">{action.label}</span>
                <span className="sm:hidden" aria-label={action.label}>
                  {Icon ? null : action.label}
                </span>
              </Button>
            );
          })}

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isExecuting}
          >
            <X className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Deseleziona</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && handleCancelConfirmation()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmationTitle || 'Conferma azione'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmationDescription ||
                `Vuoi eseguire questa azione su ${selectedIds.length} ${selectedLabel}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExecuting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isExecuting}
              className={cn(
                pendingAction?.variant === 'destructive' &&
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isExecuting ? 'Esecuzione...' : 'Conferma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
