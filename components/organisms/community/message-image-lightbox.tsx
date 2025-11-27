'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ImageAttachment } from '@/types/topics';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MessageImageLightboxProps {
  images: ImageAttachment[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption?: string;
}

/**
 * Fullscreen image lightbox with swipe navigation
 * - Swipe left/right to navigate
 * - Tap to toggle caption
 * - Arrow keys for keyboard navigation
 */
export function MessageImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  caption,
}: MessageImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [showCaption, setShowCaption] = React.useState(true);
  const [direction, setDirection] = React.useState(0);
  const isMobile = useIsMobile();

  // Reset to initial index when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setShowCaption(true);
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, images.length]);

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Handle swipe gesture
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      goToNext();
    } else if (offset > threshold || velocity > 500) {
      goToPrevious();
    }
  };

  // Toggle caption on tap (mobile)
  const handleImageClick = () => {
    if (isMobile) {
      setShowCaption((prev) => !prev);
    }
  };

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95 border-none [&>button]:hidden"
      >
        <VisuallyHidden>
          <DialogTitle>Galleria immagini</DialogTitle>
        </VisuallyHidden>

        {/* Close button - high z-index to be above swipe area */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-[100] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Counter */}
        {hasMultiple && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Navigation arrows (desktop only) */}
        {hasMultiple && !isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12',
                currentIndex === 0 && 'opacity-30 cursor-not-allowed'
              )}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12',
                currentIndex === images.length - 1 && 'opacity-30 cursor-not-allowed'
              )}
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Backdrop - click to close */}
        <div
          className="absolute inset-0 z-0"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />

        {/* Image container with swipe */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden z-10">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag={hasMultiple ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                e.stopPropagation(); // Prevent backdrop click
                handleImageClick();
              }}
              className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              {currentImage && (
                <Image
                  src={currentImage.url}
                  alt={`Immagine ${currentIndex + 1}`}
                  width={currentImage.width || 1200}
                  height={currentImage.height || 800}
                  className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain select-none pointer-events-none"
                  draggable={false}
                  priority
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption */}
        <AnimatePresence>
          {caption && showCaption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
            >
              <p className="text-white text-sm md:text-base max-w-2xl mx-auto text-center">
                {caption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dots indicator (mobile) */}
        {hasMultiple && isMobile && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
