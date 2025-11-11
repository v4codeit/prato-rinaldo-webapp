'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Filter field types
 */
export type FilterFieldType =
  | 'select'
  | 'text'
  | 'number'
  | 'number-range'
  | 'date'
  | 'date-range'
  | 'checkbox';

/**
 * Option for select fields
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Base filter field
 */
interface BaseFilterField {
  /** Unique key for the filter */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FilterFieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Hide on mobile */
  hiddenOnMobile?: boolean;
}

/**
 * Select filter field
 */
export interface SelectFilterField extends BaseFilterField {
  type: 'select';
  /** Select options */
  options: FilterOption[];
  /** Allow "all" option */
  allowAll?: boolean;
}

/**
 * Text filter field
 */
export interface TextFilterField extends BaseFilterField {
  type: 'text';
}

/**
 * Number filter field
 */
export interface NumberFilterField extends BaseFilterField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Number range filter field
 */
export interface NumberRangeFilterField extends BaseFilterField {
  type: 'number-range';
  /** Key for minimum value */
  minKey: string;
  /** Key for maximum value */
  maxKey: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step for number inputs */
  step?: number;
}

/**
 * Date filter field
 */
export interface DateFilterField extends BaseFilterField {
  type: 'date';
}

/**
 * Date range filter field
 */
export interface DateRangeFilterField extends BaseFilterField {
  type: 'date-range';
  /** Key for start date */
  fromKey: string;
  /** Key for end date */
  toKey: string;
}

/**
 * Checkbox filter field
 */
export interface CheckboxFilterField extends BaseFilterField {
  type: 'checkbox';
  /** Description text for the checkbox */
  description?: string;
}

/**
 * Union type of all filter fields
 */
export type FilterField =
  | SelectFilterField
  | TextFilterField
  | NumberFilterField
  | NumberRangeFilterField
  | DateFilterField
  | DateRangeFilterField
  | CheckboxFilterField;

/**
 * FilterPanel props
 */
export interface FilterPanelProps {
  /** Array of filter field definitions */
  fields: FilterField[];
  /** Current filter values */
  filters: Record<string, any>;
  /** Filter change handler */
  onFilterChange: (filters: Record<string, any>) => void;
  /** Search query (optional) */
  search?: string;
  /** Search change handler (optional) */
  onSearchChange?: (search: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Panel title */
  title?: string;
  /** Panel description (for mobile sheet) */
  description?: string;
  /** Custom className */
  className?: string;
  /** Show search bar */
  showSearch?: boolean;
}

/**
 * Generic FilterPanel component for admin sections
 *
 * @example
 * ```tsx
 * <FilterPanel
 *   fields={[
 *     {
 *       type: 'select',
 *       key: 'status',
 *       label: 'Stato',
 *       options: [
 *         { value: 'active', label: 'Attivo' },
 *         { value: 'inactive', label: 'Inattivo' }
 *       ],
 *       allowAll: true
 *     },
 *     {
 *       type: 'date-range',
 *       key: 'date',
 *       label: 'Periodo',
 *       fromKey: 'date_from',
 *       toKey: 'date_to'
 *     }
 *   ]}
 *   filters={filters}
 *   onFilterChange={setFilters}
 *   search={search}
 *   onSearchChange={setSearch}
 * />
 * ```
 */
export function FilterPanel({
  fields,
  filters,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Cerca...',
  title = 'Filtri',
  description = 'Applica filtri per raffinare i risultati',
  className,
  showSearch = true,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Sync local filters with prop filters
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Count active filters
  const activeFiltersCount = Object.keys(localFilters).filter((key) => {
    const value = localFilters[key];
    return value !== undefined && value !== null && value !== '' && value !== 'all';
  }).length;

  // Handle filter update
  const handleFilterUpdate = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: Record<string, any> = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // Render individual filter field
  const renderField = (field: FilterField) => {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select
              value={localFilters[field.key] || (field.allowAll ? 'all' : '')}
              onValueChange={(value) =>
                handleFilterUpdate(
                  field.key,
                  field.allowAll && value === 'all' ? undefined : value
                )
              }
            >
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={field.placeholder || field.label} />
              </SelectTrigger>
              <SelectContent>
                {field.allowAll && <SelectItem value="all">Tutti</SelectItem>}
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="text"
              placeholder={field.placeholder || field.label}
              value={localFilters[field.key] || ''}
              onChange={(e) => handleFilterUpdate(field.key, e.target.value || undefined)}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              placeholder={field.placeholder || field.label}
              min={field.min}
              max={field.max}
              step={field.step}
              value={localFilters[field.key] || ''}
              onChange={(e) =>
                handleFilterUpdate(
                  field.key,
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
            />
          </div>
        );

      case 'number-range':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                min={field.min}
                max={field.max}
                step={field.step}
                value={localFilters[field.minKey] || ''}
                onChange={(e) =>
                  handleFilterUpdate(
                    field.minKey,
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
              <Input
                type="number"
                placeholder="Max"
                min={field.min}
                max={field.max}
                step={field.step}
                value={localFilters[field.maxKey] || ''}
                onChange={(e) =>
                  handleFilterUpdate(
                    field.maxKey,
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="date"
              value={localFilters[field.key] || ''}
              onChange={(e) => handleFilterUpdate(field.key, e.target.value || undefined)}
            />
          </div>
        );

      case 'date-range':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={localFilters[field.fromKey] || ''}
                onChange={(e) =>
                  handleFilterUpdate(field.fromKey, e.target.value || undefined)
                }
                aria-label="Data inizio"
              />
              <Input
                type="date"
                value={localFilters[field.toKey] || ''}
                onChange={(e) => handleFilterUpdate(field.toKey, e.target.value || undefined)}
                aria-label="Data fine"
              />
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.key} className="flex items-start space-x-2">
            <Checkbox
              id={field.key}
              checked={!!localFilters[field.key]}
              onCheckedChange={(checked) => handleFilterUpdate(field.key, checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={field.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.label}
              </Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Filter content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {fields.map((field) => renderField(field))}

      {/* Clear filters button */}
      {activeFiltersCount > 0 && (
        <Button onClick={handleClearFilters} variant="outline" className="w-full">
          <X className="h-4 w-4 mr-2" />
          Cancella filtri ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      {showSearch && onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Cerca"
          />
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {title}
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              {title}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
