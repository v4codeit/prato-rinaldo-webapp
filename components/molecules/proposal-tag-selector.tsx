'use client';

import * as React from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { ProposalTag } from '@/types/proposals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Props per il componente ProposalTagSelector
 */
export interface ProposalTagSelectorProps {
  /** Array di tag disponibili per la selezione */
  availableTags: ProposalTag[];
  /** Array di ID dei tag attualmente selezionati */
  selectedTagIds: string[];
  /** Callback chiamata quando la selezione cambia */
  onChange: (tagIds: string[]) => void;
  /** Disabilita l'intero componente */
  disabled?: boolean;
  /** Numero massimo di tag selezionabili (default: 5) */
  maxTags?: number;
  /** Placeholder per il campo di input */
  placeholder?: string;
}

/**
 * Componente per la selezione multipla di tag per le proposte
 *
 * Features:
 * - Mostra tag selezionati come badge colorati con pulsante di rimozione
 * - Dropdown con ricerca per aggiungere nuovi tag
 * - Limite massimo di tag selezionabili
 * - Feedback visivo quando il limite è raggiunto
 * - Design mobile-first responsive
 *
 * Usage:
 * ```tsx
 * const [selectedTags, setSelectedTags] = useState<string[]>([]);
 *
 * <ProposalTagSelector
 *   availableTags={allTags}
 *   selectedTagIds={selectedTags}
 *   onChange={setSelectedTags}
 *   maxTags={5}
 * />
 * ```
 */
export function ProposalTagSelector({
  availableTags,
  selectedTagIds,
  onChange,
  disabled = false,
  maxTags = 5,
  placeholder = 'Aggiungi tag...',
}: ProposalTagSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Filtra i tag attivi e disponibili
  const activeTags = React.useMemo(
    () => availableTags.filter((tag) => tag.is_active),
    [availableTags]
  );

  // Ottieni i tag selezionati con i loro dati completi
  const selectedTags = React.useMemo(
    () => activeTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [activeTags, selectedTagIds]
  );

  // Check se il limite è stato raggiunto
  const isMaxReached = selectedTagIds.length >= maxTags;

  /**
   * Gestisce la rimozione di un tag
   */
  const handleRemoveTag = (tagId: string) => {
    if (disabled) return;
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  /**
   * Gestisce la selezione/deselezione di un tag dal dropdown
   */
  const handleToggleTag = (tagId: string) => {
    if (disabled) return;

    const isSelected = selectedTagIds.includes(tagId);

    if (isSelected) {
      // Rimuovi il tag
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      // Aggiungi il tag solo se non è stato raggiunto il limite
      if (!isMaxReached) {
        onChange([...selectedTagIds, tagId]);
      }
    }
  };

  /**
   * Ottieni il colore per lo sfondo del badge basato sul colore del tag
   */
  const getBadgeStyle = (color: string) => {
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color,
    };
  };

  return (
    <div className="space-y-2">
      {/* Tag selezionati */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            style={getBadgeStyle(tag.color)}
            className="gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
          >
            {tag.icon && <span className="text-base">{tag.icon}</span>}
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              disabled={disabled}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:pointer-events-none disabled:opacity-50"
              aria-label={`Rimuovi tag ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Pulsante per aggiungere tag */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isMaxReached}
              className="h-auto rounded-xl px-3 py-1.5 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {selectedTags.length === 0 ? placeholder : 'Aggiungi'}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[280px] p-0 md:w-[320px]"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Cerca tag..." className="h-9" />
              <CommandList>
                <CommandEmpty>Nessun tag trovato.</CommandEmpty>
                <CommandGroup>
                  {activeTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    const canSelect = !isMaxReached || isSelected;

                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleToggleTag(tag.id)}
                        disabled={!canSelect}
                        className={cn(
                          'flex items-center gap-2 rounded-md',
                          !canSelect && 'opacity-50'
                        )}
                      >
                        {/* Checkbox visuale */}
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            isSelected
                              ? 'border-violet-600 bg-violet-600 text-white'
                              : 'border-slate-300'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>

                        {/* Icona del tag */}
                        {tag.icon && (
                          <span className="text-lg">{tag.icon}</span>
                        )}

                        {/* Nome del tag */}
                        <span className="flex-1 truncate">{tag.name}</span>

                        {/* Indicatore colore */}
                        <div
                          className="h-3 w-3 rounded-full border border-slate-200"
                          style={{ backgroundColor: tag.color }}
                          aria-hidden="true"
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Footer con contatore */}
            {isMaxReached && (
              <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <p className="text-xs text-slate-600">
                  Limite massimo raggiunto ({maxTags} tag)
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        {selectedTagIds.length}/{maxTags} tag selezionati
      </p>
    </div>
  );
}
