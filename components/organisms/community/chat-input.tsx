'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatVoiceDuration, type VoiceMessageMetadata } from '@/types/topics';
import { EmojiPickerPopover } from '@/components/molecules/emoji-picker-popover';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Send,
  Image as ImageIcon,
  X,
  Reply,
  Loader2,
  Mic,
  Plus,
  Paperclip,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

  // Lock mechanism state (WhatsApp-style)
  const [isLocked, setIsLocked] = React.useState(false);
  const [touchOffset, setTouchOffset] = React.useState({ x: 0, y: 0 });
  const [isTouchActive, setIsTouchActive] = React.useState(false);

  // Touch gesture tracking refs
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Mobile detection for swipe behavior
  const isMobile = useIsMobile();

  // Accessibility: respect reduced motion preferences
  const prefersReducedMotion = useReducedMotion();

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
        // Haptic feedback for send
        if ('vibrate' in navigator) {
          navigator.vibrate(70);
        }
        await onVoiceSend(result.blob, result.metadata);
      } catch (error) {
        console.error('Error sending voice message:', error);
      }
    }

    setVoiceState('idle');
    setIsLocked(false);
    setIsTouchActive(false);  // Disable transform
    setTouchOffset({ x: 0, y: 0 });
    touchStartRef.current = null;
  }, [onVoiceSend, stopRecording]);

  // Track if we're in press-hold mode for mobile
  const isHoldingRef = React.useRef(false);

  // Handle voice cancel
  const handleCancelVoice = React.useCallback(() => {
    cancelRecording();
    setVoiceState('idle');
    setIsLocked(false);
    setIsTouchActive(false);  // Disable transform
    setTouchOffset({ x: 0, y: 0 });
    touchStartRef.current = null;
    isHoldingRef.current = false;
    // Haptic feedback (respect reduced motion)
    if ('vibrate' in navigator && !prefersReducedMotion) {
      navigator.vibrate([30, 30, 30]);
    }
  }, [cancelRecording, prefersReducedMotion]);

  // Desktop: Click to toggle recording
  const handleMicClick = React.useCallback(async () => {
    // On mobile, we use hold-to-record, so ignore clicks during hold
    if (isMobile && isHoldingRef.current) return;

    if (voiceState === 'idle') {
      // Desktop only: Start recording on click
      if (!isMobile) {
        setVoiceState('recording');
        await startRecording();
      }
    } else if (voiceState === 'recording') {
      // Click during recording = send (desktop only)
      if (duration < 0.5) {
        handleCancelVoice();
        return;
      }
      await handleSendVoice();
    }
  }, [voiceState, startRecording, duration, handleSendVoice, handleCancelVoice, isMobile]);

  // Voice recording thresholds (in pixels)
  const VOICE_THRESHOLDS = {
    MIN_DURATION: 0.5,        // Minimum recording duration to send (seconds)
    LOCK_THRESHOLD: -80,      // Swipe up distance to lock recording
    CANCEL_THRESHOLD: -100,   // Swipe left distance to cancel recording
    LOCK_INDICATOR_SHOW: -20, // Show lock indicator at this distance
    TRASH_INDICATOR_SHOW: -30, // Show trash indicator at this distance
  };

  // Mobile: Touch START - save coordinates and start recording
  const handleMicTouchStart = React.useCallback(async (e: React.TouchEvent) => {
    if (!isMobile || voiceState !== 'idle') return;

    e.preventDefault();

    // Save initial touch position
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchOffset({ x: 0, y: 0 });

    isHoldingRef.current = true;
    setIsTouchActive(true);  // Enable transform IMMEDIATELY (before async)
    setVoiceState('recording');
    await startRecording();
    // No haptic here - browser/OS already provides long-press feedback
  }, [isMobile, voiceState, startRecording]);

  // Mobile: Touch MOVE - track position and check thresholds
  const handleMicTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isHoldingRef.current || !touchStartRef.current) return;

    const touch = e.touches[0];
    const offsetX = touch.clientX - touchStartRef.current.x;
    const offsetY = touch.clientY - touchStartRef.current.y;

    setTouchOffset({ x: offsetX, y: offsetY });

    // LOCK threshold: swipe up beyond threshold
    if (offsetY < VOICE_THRESHOLDS.LOCK_THRESHOLD && !isLocked) {
      setIsLocked(true);
      // Haptic feedback for lock
      if ('vibrate' in navigator && !prefersReducedMotion) {
        navigator.vibrate(100);
      }
    }

    // CANCEL threshold: swipe left beyond threshold (only if not locked)
    if (offsetX < VOICE_THRESHOLDS.CANCEL_THRESHOLD && !isLocked) {
      handleCancelVoice();
    }
  }, [isMobile, isLocked, handleCancelVoice, prefersReducedMotion]);

  // Mobile: Touch END - send if valid, cancel if too short
  const handleMicTouchEnd = React.useCallback(async () => {
    if (!isMobile || !isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsTouchActive(false);  // Disable transform
    touchStartRef.current = null;

    // Reset visual offset (will animate back with transition)
    setTouchOffset({ x: 0, y: 0 });

    // If locked, user must tap send button - don't auto-send
    if (isLocked) return;

    // If too short, cancel
    if (duration < VOICE_THRESHOLDS.MIN_DURATION) {
      handleCancelVoice();
      return;
    }

    // Send the voice message
    await handleSendVoice();
  }, [isMobile, isLocked, duration, handleCancelVoice, handleSendVoice]);

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

      {/* Lock icon - Fixed overlay (appears when dragging up) */}
      <AnimatePresence>
        {isRecording && !isLocked && touchOffset.y < -20 && isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <motion.div
              animate={{
                scale: touchOffset.y < -80 ? 1.3 : 1,
                backgroundColor: touchOffset.y < -80 ? '#10b981' : '#9ca3af',
              }}
              className="flex items-center justify-center rounded-full p-4 shadow-lg"
            >
              <Lock className="h-7 w-7 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trash icon - Fixed overlay (appears when dragging left) */}
      <AnimatePresence>
        {isRecording && !isLocked && touchOffset.x < -30 && isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: touchOffset.x < -100 ? 1 : 0.6,
              x: 0,
              scale: touchOffset.x < -100 ? 1.2 : 1,
            }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <motion.div
              animate={{
                backgroundColor: touchOffset.x < -100 ? '#ef4444' : '#9ca3af',
              }}
              className="flex items-center justify-center rounded-full p-4 shadow-lg"
            >
              <Trash2 className="h-7 w-7 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area (hidden when images are pending) */}
      <div className={cn('flex items-center p-4', hasPendingImages && 'hidden')}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Unified Container */}
        <div
          className={cn(
            'flex-1 flex items-end gap-2',
            'bg-slate-50 dark:bg-slate-900',
            isMobile ? 'rounded-3xl' : 'rounded-2xl',
            'border',
            'p-2',
            'shadow-sm',
            'transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-blue-500/20',
            isRecording && 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          )}
        >
          {/* Attach button (normal) or Trash button (when locked) */}
          {onImageUpload && !isRecording && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex-shrink-0",
                    isMobile && "h-[52px] w-[52px]"
                  )}
                  disabled={isDisabled}
                >
                  {isUploading ? (
                    <Loader2 className={cn("h-5 w-5 animate-spin", isMobile && "h-6 w-6")} />
                  ) : (
                    <Paperclip className={cn("h-5 w-5", isMobile && "h-6 w-6")} />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-auto p-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  Immagine
                </Button>
              </PopoverContent>
            </Popover>
          )}

          {/* Trash button when recording is locked */}
          {isRecording && isLocked && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 flex-shrink-0",
                isMobile && "h-[52px] w-[52px]"
              )}
              onClick={handleCancelVoice}
            >
              <Trash2 className={cn("h-5 w-5", isMobile && "h-6 w-6")} />
            </Button>
          )}

          {/* CONDITIONAL: Recording UI or Textarea */}
          {isRecording ? (
            /* Recording UI inside the unified container */
            <div className="flex-1 flex items-center gap-2 px-2">
              {/* Waveform visualization */}
              <div className={cn(
                "flex-1 flex items-center justify-center gap-0.5",
                isMobile ? "h-8" : "h-6"
              )}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full bg-red-500"
                    animate={{
                      height: `${5 + audioLevel * 19 * (Math.sin(i * 0.5 + Date.now() / 200) * 0.3 + 0.7)}px`,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>

              {/* Timer */}
              <span className={cn(
                "font-mono text-red-600 dark:text-red-400 min-w-[36px] text-right",
                isMobile ? "text-sm" : "text-xs"
              )}>
                {formatVoiceDuration(duration)}
              </span>
            </div>
          ) : (
            /* Normal textarea */
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              rows={1}
              className={cn(
                'flex-1 resize-none',
                'border-0 bg-transparent shadow-none',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'py-2.5 px-2',
                'text-sm outline-none',
                'placeholder:text-muted-foreground/60',
                isMobile ? 'min-h-[58px] max-h-[144px]' : 'min-h-[48px] max-h-[144px]'
              )}
            />
          )}

          {/* Emoji picker (inside pill) */}
          {!isRecording && (
            <EmojiPickerPopover
              onEmojiSelect={handleEmojiInsert}
              triggerClassName={cn(
                "rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                isMobile && "h-[52px] w-[52px]"
              )}
              iconClassName={cn("h-5 w-5", isMobile && "h-6 w-6")}
            />
          )}

          {/* Mic/Send Button (inside pill) */}
          {/* Mobile: hold-to-record, release-to-send | Desktop: click-to-toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  className={cn(
                    'rounded-xl flex-shrink-0 shadow-md',
                    'bg-blue-600 hover:bg-blue-700 text-white',
                    'flex items-center justify-center',
                    isRecording && !isLocked && 'bg-red-500 hover:bg-red-600',
                    isLocked && 'bg-green-600 hover:bg-green-700',
                    // Prevent text selection on mobile hold
                    'select-none touch-none',
                    // Mobile scaling
                    isMobile ? 'h-[52px] w-[52px]' : 'h-11 w-11'
                  )}
                  // Manual transform for WhatsApp-style gesture tracking
                  // Using style instead of Framer Motion drag for press-and-hold compatibility
                  // Using isTouchActive (sync) instead of isRecording (async) for immediate response
                  style={{
                    transform: isTouchActive && isMobile && !isLocked && !prefersReducedMotion
                      ? `translate(${touchOffset.x}px, ${touchOffset.y}px) scale(1.15)`
                      : 'translate(0, 0) scale(1)',
                    // Elastic snap-back transition only when NOT actively dragging
                    transition: !isHoldingRef.current
                      ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s'
                      : 'background-color 0.2s',
                  }}
                  disabled={isDisabled && !isRecording}
                  // Desktop click handler
                  onClick={hasText ? handleSend : (isLocked ? handleSendVoice : (isMobile ? undefined : handleMicClick))}
                  // Mobile touch handlers - manual gesture tracking
                  onTouchStart={!hasText && !isRecording ? handleMicTouchStart : undefined}
                  onTouchMove={isRecording && !isLocked ? handleMicTouchMove : undefined}
                  onTouchEnd={!hasText && isRecording ? handleMicTouchEnd : undefined}
                  onTouchCancel={!hasText && isRecording ? handleMicTouchEnd : undefined}
                >
                  <AnimatePresence mode="wait">
                    {voiceState === 'sending' ? (
                      <motion.div
                        key="loader"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Loader2 className={cn("h-4 w-4 animate-spin", isMobile && "h-5 w-5")} />
                      </motion.div>
                    ) : hasText ? (
                      <motion.div
                        key="send"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Send className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      </motion.div>
                    ) : isLocked ? (
                      <motion.div
                        key="send-locked"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Send className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      </motion.div>
                    ) : isRecording ? (
                      <motion.div
                        key="mic-recording"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Mic className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mic"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Mic className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                {voiceState === 'sending'
                  ? 'Invio in corso...'
                  : hasText
                    ? 'Invia messaggio (Invio)'
                    : isRecording
                      ? isMobile ? 'Rilascia per inviare' : 'Clicca per inviare'
                      : isMobile ? 'Tieni premuto per registrare' : 'Clicca per registrare'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>


      {/* Recording error */}
      {
        recordingError && (
          <div className="px-4 pb-2">
            <p className="text-xs text-destructive">{recordingError}</p>
          </div>
        )
      }
    </div >
  );
}
