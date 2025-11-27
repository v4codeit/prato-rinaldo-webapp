'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatVoiceDuration } from '@/types/topics';

interface VoiceRecordingOverlayProps {
  /** Whether overlay is visible */
  isVisible: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** Audio level 0-1 for waveform visualization */
  audioLevel: number;
  /** Current swipe offset in pixels (negative = left) */
  swipeOffset: number;
  /** Called when cancel action is triggered */
  onCancel: () => void;
}

/**
 * Fullscreen overlay during voice recording
 * WhatsApp-style with waveform, timer, and swipe-to-cancel indicator
 */
export function VoiceRecordingOverlay({
  isVisible,
  duration,
  audioLevel,
  swipeOffset,
  onCancel,
}: VoiceRecordingOverlayProps) {
  // Calculate cancel progress (0 to 1)
  const cancelProgress = Math.min(1, Math.abs(swipeOffset) / 100);
  const isNearCancel = cancelProgress > 0.5;

  // Generate waveform bars
  const waveformBars = React.useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      // Create variation based on index and audio level
      const baseHeight = 4;
      const maxHeight = 32;
      const variation = Math.sin((i + Date.now() / 100) * 0.5) * 0.3 + 0.7;
      const height = baseHeight + audioLevel * maxHeight * variation;
      return height;
    });
  }, [audioLevel]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'absolute inset-x-0 bottom-0 z-50',
            'flex flex-col items-center justify-center',
            'px-4 py-6 rounded-t-2xl',
            'transition-colors duration-200',
            isNearCancel ? 'bg-red-600' : 'bg-red-500'
          )}
          style={{
            // Slide overlay with swipe
            transform: `translateX(${swipeOffset}px)`,
          }}
        >
          {/* Recording pulse animation */}
          <motion.div
            className="absolute inset-0 bg-red-400 rounded-t-2xl"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-md">
            {/* Cancel indicator when swiping */}
            <AnimatePresence>
              {isNearCancel && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <Trash2 className="h-8 w-8 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-1 h-12 mb-4">
              {waveformBars.map((height, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-white/80"
                  animate={{
                    height: `${height}px`,
                  }}
                  transition={{
                    duration: 0.1,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Duration timer */}
            <motion.div
              className="text-center mb-4"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-2xl font-mono text-white font-bold">
                {formatVoiceDuration(duration)}
              </span>
            </motion.div>

            {/* Swipe hint */}
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <motion.div
                animate={{
                  x: [-5, 0, -5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
              <span>Scorri per cancellare</span>
            </div>
          </div>

          {/* Cancel button (visible on desktop or when near cancel threshold) */}
          {isNearCancel && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={onCancel}
            >
              <Trash2 className="h-5 w-5 text-white" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
