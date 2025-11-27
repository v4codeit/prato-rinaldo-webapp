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
import { AVAILABLE_REACTIONS, formatVoiceDuration, type VoiceMessageMetadata } from '@/types/topics';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Reply,
  Loader2,
  Mic,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface ReplyContext {
  id: string;
  content: string;
  authorName: string | null;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string; // URL.createObjectURL() for preview (NO upload yet)
}

interface UploadedImage {
  url: string;
  width?: number;
  height?: number;
}

interface ChatInputProps {
  onSend: (content: string, replyToId?: string, images?: UploadedImage[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onImageUpload?: (file: File) => Promise<UploadedImage>;
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
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([]);
  const [imageCaption, setImageCaption] = React.useState('');

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Mobile detection for swipe behavior
  const isMobile = useIsMobile();

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

  // Simplified mic click handler (works for both desktop and mobile)
  const handleMicClick = React.useCallback(async () => {
    if (voiceState === 'idle') {
      // Start recording
      setVoiceState('recording');
      await startRecording();
      // Haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } else if (voiceState === 'recording') {
      // Click during recording = send
      if (duration < 0.5) {
        handleCancelVoice();
        return;
      }
      await handleSendVoice();
    }
  }, [voiceState, startRecording, duration, handleSendVoice, handleCancelVoice, isMobile]);

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

  // Handle image selection - NO UPLOAD YET, just create previews
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Validate and filter files
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        alert(`${file.name} è troppo grande (max 5MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} non è un formato supportato`);
        return false;
      }
      return true;
    });

    // Create preview URLs (NO UPLOAD!)
    const newPending: PendingImage[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...newPending]);

    // Reset input to allow re-selection of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a single pending image
  const removeImage = React.useCallback((id: string) => {
    setPendingImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview); // Cleanup memory
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // Clear all pending images
  const clearAllImages = React.useCallback(() => {
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setPendingImages([]);
    setImageCaption('');
  }, [pendingImages]);

  // Send images - UPLOAD HAPPENS HERE
  const handleSendImages = React.useCallback(async () => {
    if (pendingImages.length === 0 || !onImageUpload) return;

    setIsUploading(true);

    try {
      // Upload all images in parallel
      const uploadPromises = pendingImages.map((img) => onImageUpload(img.file));
      const uploadedImages = await Promise.all(uploadPromises);

      // Send message with images
      await onSend(imageCaption, replyTo?.id, uploadedImages);

      // Cleanup
      clearAllImages();
      onCancelReply?.();
    } catch (error) {
      console.error('Error sending images:', error);
      alert('Errore nell\'invio delle immagini');
    } finally {
      setIsUploading(false);
    }
  }, [pendingImages, onImageUpload, onSend, imageCaption, replyTo?.id, clearAllImages, onCancelReply]);

  // Cleanup pending images on unmount
  React.useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed values
  const hasText = content.trim().length > 0;
  const hasPendingImages = pendingImages.length > 0;
  const isRecording = voiceState === 'recording';
  const isDisabled = disabled || isSending || isUploading || voiceState === 'sending';
  const showMicButton = !hasText && !hasPendingImages && onVoiceSend;

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

      {/* Image Preview Panel (WhatsApp-style) */}
      {hasPendingImages && (
        <div className="border-b bg-muted/50 p-3">
          {/* Close all button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {pendingImages.length} {pendingImages.length === 1 ? 'immagine' : 'immagini'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-destructive"
              onClick={clearAllImages}
            >
              <X className="h-4 w-4 mr-1" />
              Annulla
            </Button>
          </div>

          {/* Thumbnails row */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {pendingImages.map((img) => (
              <div key={img.id} className="relative shrink-0 group">
                <Image
                  src={img.preview}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="rounded-lg object-cover w-20 h-20"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full
                             bg-destructive text-destructive-foreground
                             flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Add more images button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30
                         flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>

          {/* Caption input + Send button */}
          <div className="flex gap-2">
            <Input
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Aggiungi una didascalia..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendImages();
                }
                if (e.key === 'Escape') {
                  clearAllImages();
                }
              }}
            />
            <Button
              onClick={handleSendImages}
              disabled={isUploading}
              className="shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Input area (hidden when images are pending) */}
      <div className={cn('flex items-end gap-2 p-4', hasPendingImages && 'hidden')}>
        {/* Image upload (hidden during recording) */}
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
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* CONDITIONAL: Textarea OR Inline Recording UI */}
        {isRecording ? (
          /* ═══════════════════════════════════════════════════════
           * INLINE RECORDING UI (same height as textarea)
           * ═══════════════════════════════════════════════════════ */
          <motion.div
            className="flex-1 flex items-center gap-2 px-3 py-2
                       bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800
                       min-h-[44px]"
            drag={isMobile ? 'x' : false}
            dragConstraints={{ left: -150, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -100) {
                handleCancelVoice();
              }
            }}
          >
            {/* Cancel button (always visible) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
              onClick={handleCancelVoice}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Waveform bars (inline) */}
            <div className="flex-1 flex items-center justify-center gap-0.5 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-red-500"
                  animate={{
                    height: `${4 + audioLevel * 20 * (Math.sin(i * 0.5 + Date.now() / 200) * 0.3 + 0.7)}px`,
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            {/* Timer */}
            <span className="text-sm font-mono text-red-600 dark:text-red-400 min-w-[40px] text-right">
              {formatVoiceDuration(duration)}
            </span>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════
           * NORMAL TEXTAREA (idle state)
           * ═══════════════════════════════════════════════════════ */
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

        {/* Unified Mic/Send Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  'h-10 w-10 flex-shrink-0 transition-all',
                  isRecording && 'bg-red-500 hover:bg-red-600'
                )}
                disabled={isDisabled && !isRecording}
                onClick={hasText ? handleSend : handleMicClick}
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
                    : 'Clicca per registrare'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Mobile swipe hint (only during recording on mobile) */}
      {isRecording && isMobile && (
        <p className="text-xs text-center text-muted-foreground pb-2">
          ← Scorri per cancellare
        </p>
      )}

      {/* Recording error */}
      {recordingError && (
        <div className="px-4 pb-2">
          <p className="text-xs text-destructive">{recordingError}</p>
        </div>
      )}
    </div>
  );
}
