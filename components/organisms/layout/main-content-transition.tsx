'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface MainContentTransitionProps {
  children: ReactNode;
}

/**
 * Main Content Transition Wrapper
 *
 * Provides smooth page transitions using Framer Motion while keeping
 * the app shell (header, sidebar, footer, bottom nav) always visible.
 *
 * Animation:
 * - Fade: opacity 0.95 → 1 (subtle)
 * - Micro-slide: translateY 8px → 0
 * - Duration: 200ms (fast, native app feel)
 * - Respects prefers-reduced-motion
 */
export function MainContentTransition({ children }: MainContentTransitionProps) {
  const pathname = usePathname();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion for accessibility
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // If user prefers reduced motion, disable animations
  const duration = prefersReducedMotion ? 0 : 0.2; // 200ms
  const initialOpacity = prefersReducedMotion ? 1 : 0.95;
  const initialY = prefersReducedMotion ? 0 : 8;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: initialOpacity, y: initialY }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: initialOpacity, y: -initialY }}
        transition={{
          duration,
          ease: 'easeInOut',
        }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
