'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseSwipeBackOptions {
  /** Enable/disable the gesture (default: true) */
  enabled?: boolean;
  /** Edge zone width in pixels (default: 20) */
  edgeWidth?: number;
  /** Minimum swipe distance in pixels (default: 80) */
  minDistance?: number;
  /** Maximum vertical deviation in pixels (default: 50) */
  maxVerticalDeviation?: number;
}

export function useSwipeBack({
  enabled = true,
  edgeWidth = 20,
  minDistance = 80,
  maxVerticalDeviation = 50,
}: UseSwipeBackOptions = {}) {
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only register touches starting from the left edge
      if (touch.clientX <= edgeWidth) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [edgeWidth]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      touchStartRef.current = null;

      // Check swipe criteria: sufficient horizontal distance, limited vertical deviation
      if (deltaX >= minDistance && deltaY <= maxVerticalDeviation) {
        router.back();
      }
    },
    [minDistance, maxVerticalDeviation, router]
  );

  useEffect(() => {
    if (!enabled) return;

    // Only activate on mobile
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
