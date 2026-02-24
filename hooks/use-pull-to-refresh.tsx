'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UsePullToRefreshOptions {
  /** Enable/disable (default: true) */
  enabled?: boolean;
  /** Minimum pull distance to trigger refresh in px (default: 80) */
  threshold?: number;
  /** Called on refresh. If not provided, calls router.refresh() */
  onRefresh?: () => Promise<void> | void;
}

export function usePullToRefresh({
  enabled = true,
  threshold = 80,
  onRefresh,
}: UsePullToRefreshOptions = {}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return;

      // Only activate when scrolled to top
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
      if (scrollTop > 5) return;

      touchStartRef.current = {
        y: e.touches[0].clientY,
        scrollTop,
      };
    },
    [enabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current || isRefreshing) return;

      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      // Only track downward pull when at top
      if (deltaY > 0 && touchStartRef.current.scrollTop <= 5) {
        // Apply resistance (logarithmic)
        const distance = Math.min(deltaY * 0.4, 120);
        setPullDistance(distance);
      }
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
          // Small delay for server data to arrive
          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh, router]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    const options = { passive: true } as AddEventListenerOptions;
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    /** Render this at the top of your scrollable area */
    PullIndicator: enabled ? PullIndicator : () => null,
    pullIndicatorProps: { pullDistance, isRefreshing },
  };
}

/** Visual pull-to-refresh indicator */
function PullIndicator({
  pullDistance,
  isRefreshing,
}: {
  pullDistance: number;
  isRefreshing: boolean;
}) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / 80, 1);
  const rotation = pullDistance * 3;

  return (
    <div
      className="flex justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: isRefreshing ? 48 : pullDistance > 0 ? pullDistance : 0 }}
    >
      <div className="flex items-center justify-center">
        <svg
          className={`h-6 w-6 text-teal-500 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ opacity: progress, transform: `rotate(${rotation}deg)` }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>
    </div>
  );
}
