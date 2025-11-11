'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendMessage } from '@/app/actions/conversations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
}

/**
 * MessageInput Component
 *
 * Client component for sending messages in a conversation.
 *
 * Features:
 * - Auto-growing textarea
 * - Character counter (max 2000)
 * - Send on Ctrl+Enter / Cmd+Enter
 * - Optimistic updates
 * - Loading states
 * - Error handling
 * - Disabled state for closed conversations
 */
export function MessageInput({ conversationId, disabled }: MessageInputProps) {
  const router = useRouter();
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const characterCount = message.length;
  const isOverLimit = characterCount > 2000;
  const isNearLimit = characterCount > 1800;
  const canSend = message.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  // Auto-focus textarea on mount
  React.useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSend) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSend) {
      return;
    }

    const messageContent = message.trim();
    setIsLoading(true);

    // Optimistic update - clear message immediately
    setMessage('');

    try {
      const result = await sendMessage(conversationId, messageContent);

      if (result.error) {
        // Restore message on error
        setMessage(messageContent);
        toast.error(result.error);
        return;
      }

      // Success - refresh the page to show new message
      router.refresh();
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setMessage(messageContent);
      toast.error('Errore nell\'invio del messaggio. Riprova.');
    } finally {
      setIsLoading(false);
      // Re-focus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        {/* Message Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio... (Ctrl+Invio per inviare)"
          className="min-h-[80px] max-h-[200px] resize-none"
          disabled={disabled || isLoading}
          maxLength={2100} // Allow typing a bit over to show error
          aria-label="Scrivi un messaggio"
          aria-describedby="char-count-input"
        />

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="flex-shrink-0 h-[80px] w-12"
          aria-label="Invia messaggio"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Character Counter */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          Suggerimento: Premi <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Invio</kbd> per inviare
        </p>
        <p
          id="char-count-input"
          className={cn(
            isOverLimit
              ? 'text-destructive font-medium'
              : isNearLimit
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-muted-foreground'
          )}
        >
          {characterCount}/2000
        </p>
      </div>
    </form>
  );
}
