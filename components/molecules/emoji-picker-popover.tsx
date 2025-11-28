'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { Theme, EmojiStyle } from 'emoji-picker-react';

// Dynamic import (SSR-safe)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="w-[320px] h-[400px] animate-pulse bg-muted rounded-lg" />,
});

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  triggerClassName?: string;
  iconClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function EmojiPickerPopover({
  onEmojiSelect,
  triggerClassName,
  iconClassName = "h-5 w-5",
  side = 'top',
  align = 'end',
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClassName}>
          <Smile className={iconClassName} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" side={side} align={align}>
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          emojiStyle={EmojiStyle.NATIVE}
          width={320}
          height={400}
          searchPlaceholder="Cerca emoji..."
          previewConfig={{ showPreview: false }}
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover >
  );
}
