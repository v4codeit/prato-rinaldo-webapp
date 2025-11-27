'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AVAILABLE_REACTIONS } from '@/types/topics';
import {
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Reply,
  Loader2,
} from 'lucide-react';

interface ReplyContext {
  id: string;
  content: string;
  authorName: string | null;
}

interface ChatInputProps {
  onSend: (content: string, replyToId?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onImageUpload?: (file: File) => Promise<void>;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * ChatInput - Message input with emoji picker, image upload, and reply support
 */
export function ChatInput({
  onSend,
  onTyping,
  onImageUpload,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Scrivi un messaggio...',
  className,
}: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Focus input when reply context changes
  React.useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  // Handle typing indicator
  const handleTyping = React.useCallback(() => {
    onTyping?.(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 2000);
  }, [onTyping]);

  // Cleanup typing timeout
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTyping();
  };

  // Handle send
  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    onTyping?.(false);

    try {
      await onSend(trimmed, replyTo?.id);
      setContent('');
      onCancelReply?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Cancel reply on Escape
    if (e.key === 'Escape' && replyTo) {
      onCancelReply?.();
    }
  };

  // Handle emoji insert
  const handleEmojiInsert = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Il file è troppo grande (max 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo di file non supportato');
      return;
    }

    setIsUploading(true);
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isDisabled = disabled || isSending || isUploading;

  return (
    <div className={cn('border-t bg-background', className)}>
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b">
          <Reply className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary truncate">
              Rispondi a {replyTo.authorName || 'Utente'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Image upload */}
        {onImageUpload && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  disabled={isDisabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Allega immagine</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="min-h-[44px] max-h-[200px] resize-none pr-12"
          />

          {/* Emoji picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1 h-8 w-8"
                disabled={isDisabled}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2"
              side="top"
              align="end"
            >
              <div className="grid grid-cols-6 gap-1">
                {AVAILABLE_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiInsert(emoji)}
                    className="p-2 hover:bg-accent rounded transition-colors text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Send button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                disabled={isDisabled || !content.trim()}
                onClick={handleSend}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Invia messaggio (Invio)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
