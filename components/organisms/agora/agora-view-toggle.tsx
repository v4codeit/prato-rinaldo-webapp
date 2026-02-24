'use client';

import { LayoutGrid, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type AgoraViewMode = 'grid' | 'kanban';

interface AgoraViewToggleProps {
  view: AgoraViewMode;
  onViewChange: (view: AgoraViewMode) => void;
}

/**
 * AgoraViewToggle Component
 *
 * Toggle between Grid (card list) and Kanban (board) views
 */
export function AgoraViewToggle({ view, onViewChange }: AgoraViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('grid')}
        className={cn(
          'rounded-lg px-3 h-8 transition-all',
          view === 'grid'
            ? 'bg-white shadow-sm text-slate-900'
            : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        <span className="text-sm font-medium">Lista</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('kanban')}
        className={cn(
          'rounded-lg px-3 h-8 transition-all',
          view === 'kanban'
            ? 'bg-white shadow-sm text-slate-900'
            : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'
        )}
      >
        <Kanban className="h-4 w-4 mr-1.5" />
        <span className="text-sm font-medium">Kanban</span>
      </Button>
    </div>
  );
}
