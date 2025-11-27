'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { Theme, EmojiStyle } from 'emoji-picker-react';

// Dynamic import (SSR-safe)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="w-[300px] h-[350px] animate-pulse bg-muted rounded-lg" />,
});

interface ReactionPickerPopoverProps {
  onReactionSelect: (emoji: string) => void;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function ReactionPickerPopover({
  onReactionSelect,
  children,
  side = 'top',
  align = 'start',
}: ReactionPickerPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReactionSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <SmilePlus className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" side={side} align={align}>
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          emojiStyle={EmojiStyle.NATIVE}
          width={300}
          height={350}
          searchPlaceholder="Cerca..."
          previewConfig={{ showPreview: false }}
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
}
