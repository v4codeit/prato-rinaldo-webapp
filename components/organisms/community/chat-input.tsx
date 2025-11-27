'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { AVAILABLE_REACTIONS, type VoiceMessageMetadata } from '@/types/topics';
import { VoiceRecordingOverlay } from './voice/voice-recording-overlay';
import { useLongPress } from '@/hooks/use-long-press';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import {
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Reply,
  Loader2,
  Mic,
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
  onVoiceSend?: (blob: Blob, metadata: Omit<VoiceMessageMetadata, 'waveform'>) => Promise<void>;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

type VoiceState = 'idle' | 'recording' | 'sending';

/**
 * ChatInput - WhatsApp-style message input with unified Mic/Send button
 *
 * Mobile: press-and-hold to record, release to send, swipe left to cancel
 * Desktop: click to toggle recording mode
 */
export function ChatInput({
  onSend,
  onTyping,
  onImageUpload,
  onVoiceSend,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Scrivi un messaggio...',
  className,
}: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [voiceState, setVoiceState] = React.useState<VoiceState>('idle');

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Voice recording hook
  const {
    state: recordingState,
    duration,
    audioLevel,
    error: recordingError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecording({
    maxDuration: 60,
    onPermissionDenied: () => {
      alert('Per registrare messaggi vocali, consenti l\'accesso al microfono nelle impostazioni del browser.');
    },
  });

  // Handle voice send
  const handleSendVoice = React.useCallback(async () => {
    if (!onVoiceSend) return;

    setVoiceState('sending');
    const result = await stopRecording();

    if (result) {
      try {
        await onVoiceSend(result.blob, result.metadata);
      } catch (error) {
        console.error('Error sending voice message:', error);
      }
    }

    setVoiceState('idle');
  }, [onVoiceSend, stopRecording]);

  // Handle voice cancel
  const handleCancelVoice = React.useCallback(() => {
    cancelRecording();
    setVoiceState('idle');
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  }, [cancelRecording]);

  // Desktop: click toggle
  const handleDesktopToggle = React.useCallback(async () => {
    if (voiceState === 'idle') {
      setVoiceState('recording');
      await startRecording();
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } else if (voiceState === 'recording') {
      // Check minimum duration
      if (duration < 0.5) {
        handleCancelVoice();
        return;
      }
      await handleSendVoice();
    }
  }, [voiceState, startRecording, duration, handleSendVoice, handleCancelVoice]);

  // Mobile: press start
  const handleMobileStart = React.useCallback(async () => {
    // Prevent double-start if already recording
    if (voiceState !== 'idle') return;

    setVoiceState('recording');
    await startRecording();
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [startRecording, voiceState]);

  // Mobile: release send
  const handleMobileSend = React.useCallback(async () => {
    // Check minimum duration
    if (duration < 0.5) {
      handleCancelVoice();
      return;
    }
    await handleSendVoice();
  }, [duration, handleSendVoice, handleCancelVoice]);

  // Long press hook for Mic button
  const { handlers: longPressHandlers, swipeOffset, isLongPressing } = useLongPress({
    threshold: 200,
    swipeCancelThreshold: -100,
    onShortPress: handleDesktopToggle,
    onLongPressStart: handleMobileStart,
    onLongPressEnd: handleMobileSend,
    onSwipeCancel: handleCancelVoice,
  });

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

  // Handle send text
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
    if (e.key === 'Escape') {
      if (voiceState === 'recording') {
        handleCancelVoice();
      } else if (replyTo) {
        onCancelReply?.();
      }
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

  // Computed values
  const hasText = content.trim().length > 0;
  const showMicButton = !hasText && onVoiceSend && voiceState === 'idle';
  const isRecording = voiceState === 'recording';
  const isDisabled = disabled || isSending || isUploading || voiceState === 'sending';

  // CRITICAL: Keep longPressHandlers active during recording so user can release to send
  const shouldAttachVoiceHandlers = !hasText && onVoiceSend && voiceState !== 'sending';

  return (
    <div className={cn('border-t bg-background relative', className)}>
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

      {/* Voice Recording Overlay */}
      <VoiceRecordingOverlay
        isVisible={isRecording}
        duration={duration}
        audioLevel={audioLevel}
        swipeOffset={swipeOffset}
        onCancel={handleCancelVoice}
      />

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Image upload */}
        {onImageUpload && !isRecording && (
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

        {/* Text input (hidden during recording) */}
        {!isRecording && (
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
        )}

        {/* Recording spacer (takes space when recording) */}
        {isRecording && <div className="flex-1" />}

        {/* Unified Mic/Send Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  'h-10 w-10 flex-shrink-0 transition-all select-none touch-none',
                  isRecording && 'bg-red-500 hover:bg-red-600 animate-pulse'
                )}
                disabled={isDisabled && !isRecording}
                onClick={hasText ? handleSend : undefined}
                {...(shouldAttachVoiceHandlers ? longPressHandlers : {})}
              >
                <AnimatePresence mode="wait">
                  {voiceState === 'sending' ? (
                    <motion.div
                      key="loader"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </motion.div>
                  ) : hasText ? (
                    <motion.div
                      key="send"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Send className="h-5 w-5" />
                    </motion.div>
                  ) : isRecording ? (
                    <motion.div
                      key="send-voice"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Send className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Mic className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {voiceState === 'sending'
                ? 'Invio in corso...'
                : hasText
                  ? 'Invia messaggio (Invio)'
                  : isRecording
                    ? 'Clicca per inviare'
                    : 'Tieni premuto per registrare'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Recording error */}
      {recordingError && (
        <div className="px-4 pb-2">
          <p className="text-xs text-destructive">{recordingError}</p>
        </div>
      )}
    </div>
  );
}
