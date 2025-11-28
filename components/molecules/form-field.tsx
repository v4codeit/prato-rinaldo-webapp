import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea';
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  className?: string;
  rows?: number; // For textarea
  autoComplete?: string; // HTML autocomplete attribute for accessibility
}

/**
 * FormField - Molecule component
 * Combines Label + Input/Textarea + Error display
 * Used throughout all forms for consistent styling
 */
export function FormField({
  label,
  name,
  type = 'text',
  error,
  required,
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  rows = 4,
  autoComplete,
}: FormFieldProps) {
  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <InputComponent
        id={name}
        name={name}
        type={type === 'textarea' ? undefined : type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        rows={type === 'textarea' ? rows : undefined}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? 'border-destructive' : ''}
      />

      {error && (
        <Alert variant="destructive" id={`${name}-error`} className="py-2">
          <p className="text-sm">{error}</p>
        </Alert>
      )}
    </div>
  );
}
