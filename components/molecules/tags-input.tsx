'use client';

import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TagsInputProps {
  label: string;
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  required?: boolean;
  helperText?: string;
  error?: string;
}

export function TagsInput({
  label,
  name,
  value = [],
  onChange,
  placeholder = 'Scrivi e premi Invio...',
  maxTags = 10,
  required = false,
  helperText,
  error,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return;

    if (value.length >= maxTags) {
      return;
    }

    if (value.includes(trimmedValue)) {
      setInputValue('');
      return;
    }

    onChange([...value, trimmedValue]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="space-y-2">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <Badge key={index} variant="secondary" className="px-2 py-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Rimuovi ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Input
          id={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length >= maxTags ? `Massimo ${maxTags} elementi` : placeholder}
          disabled={value.length >= maxTags}
          className={error ? 'border-destructive' : ''}
        />
      </div>

      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} / {maxTags} elementi
      </p>

      {/* Hidden input to store JSON array for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(value)} />
    </div>
  );
}
