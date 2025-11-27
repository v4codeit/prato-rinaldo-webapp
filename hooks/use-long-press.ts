'use client';

import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  /** Milliseconds before long press triggers (default: 200) */
  threshold?: number;
  /** Pixels to swipe left to cancel (default: -100) */
  swipeCancelThreshold?: number;
  /** Called on short press (desktop click toggle) */
  onShortPress?: () => void;
  /** Called when long press starts (mobile press) */
  onLongPressStart?: () => void;
  /** Called when long press ends (mobile release to send) */
  onLongPressEnd?: () => void;
  /** Called when swipe left cancels (mobile swipe) */
  onSwipeCancel?: () => void;
}

interface UseLongPressReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
  };
  /** Current swipe offset in pixels (negative = left) */
  swipeOffset: number;
  /** Whether currently in long press state */
  isLongPressing: boolean;
}

/**
 * Hook for WhatsApp-style press-and-hold + swipe gestures
 *
 * Mobile: press-and-hold to record, release to send, swipe left to cancel
 * Desktop: click to toggle (short press handler)
 */
export function useLongPress(options: UseLongPressOptions = {}): UseLongPressReturn {
  const {
    threshold = 200,
    swipeCancelThreshold = -100,
    onShortPress,
    onLongPressStart,
    onLongPressEnd,
    onSwipeCancel,
  } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startXRef = useRef(0);
  const hasCancelledRef = useRef(false);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Clear timer utility
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    clearTimer();
    isLongPressRef.current = false;
    hasCancelledRef.current = false;
    setSwipeOffset(0);
    setIsLongPressing(false);
  }, [clearTimer]);

  // Start press (both touch and mouse)
  const handleStart = useCallback(
    (clientX: number) => {
      hasCancelledRef.current = false;
      isLongPressRef.current = false;
      startXRef.current = clientX;
      setSwipeOffset(0);

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsLongPressing(true);
        onLongPressStart?.();
      }, threshold);
    },
    [threshold, onLongPressStart]
  );

  // End press (both touch and mouse)
  const handleEnd = useCallback(() => {
    clearTimer();

    if (hasCancelledRef.current) {
      // Already cancelled via swipe, don't trigger anything
      resetState();
      return;
    }

    if (isLongPressRef.current) {
      // Long press ended - send action
      onLongPressEnd?.();
    } else {
      // Short press - desktop toggle
      onShortPress?.();
    }

    resetState();
  }, [clearTimer, resetState, onLongPressEnd, onShortPress]);

  // Move (touch only - for swipe detection)
  const handleMove = useCallback(
    (clientX: number) => {
      if (!isLongPressRef.current || hasCancelledRef.current) return;

      const offset = clientX - startXRef.current;
      setSwipeOffset(Math.min(0, offset)); // Only allow left swipe (negative)

      // Check if swipe threshold reached
      if (offset < swipeCancelThreshold) {
        hasCancelledRef.current = true;
        clearTimer();
        onSwipeCancel?.();
        resetState();
      }
    },
    [swipeCancelThreshold, clearTimer, resetState, onSwipeCancel]
  );

  // Cancel (mouse leave)
  const handleCancel = useCallback(() => {
    if (isLongPressRef.current && !hasCancelledRef.current) {
      hasCancelledRef.current = true;
      onSwipeCancel?.();
    }
    resetState();
  }, [resetState, onSwipeCancel]);

  // Touch handlers
  // Note: Don't use preventDefault() on touchstart/touchend as modern browsers
  // treat these as passive by default. Use CSS touch-action: none instead.
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientX);
    },
    [handleStart]
  );

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      handleEnd();
    },
    [handleEnd]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      handleStart(e.clientX);
    },
    [handleStart]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      handleEnd();
    },
    [handleEnd]
  );

  const onMouseLeave = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  return {
    handlers: {
      onTouchStart,
      onTouchEnd,
      onTouchMove,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
    },
    swipeOffset,
    isLongPressing,
  };
}
