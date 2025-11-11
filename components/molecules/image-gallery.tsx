'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export function ImageGallery({ images, alt = 'Immagine prodotto' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nessuna immagine disponibile</p>
        </div>
      </div>
    );
  }

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrevious, handleNext]);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted group">
        <Image
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          fill
          className="object-cover cursor-pointer transition-transform group-hover:scale-105"
          onClick={() => setLightboxOpen(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows - Desktop */}
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              aria-label="Immagine precedente"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Immagine successiva"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-3 py-1.5 rounded-md font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Click to zoom hint */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Clicca per ingrandire
        </div>
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border-2 transition-all',
                index === currentIndex
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Vai all'immagine ${index + 1}`}
            >
              <Image
                src={image}
                alt={`Miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 20vw, 10vw"
              />
            </button>
          ))}

          {/* More images indicator */}
          {images.length > 5 && (
            <button
              type="button"
              className="relative aspect-square flex items-center justify-center bg-muted rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Visualizza tutte le ${images.length} immagini`}
            >
              <div className="text-center">
                <span className="text-sm font-medium text-muted-foreground">
                  +{images.length - 5}
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
          <VisuallyHidden asChild>
            <DialogTitle>Galleria immagini</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <DialogDescription>
              Visualizza l'immagine a schermo intero. Usa le frecce per navigare tra le immagini
            </DialogDescription>
          </VisuallyHidden>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10 z-50"
              onClick={() => setLightboxOpen(false)}
              aria-label="Chiudi"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Main lightbox image */}
            <div className="relative w-full h-full p-12">
              <Image
                src={images[currentIndex]}
                alt={`${alt} ${currentIndex + 1} - Vista ingrandita`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={95}
              />
            </div>

            {/* Navigation arrows - Lightbox */}
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  aria-label="Immagine precedente"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Immagine successiva"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image counter - Lightbox */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Thumbnail strip - Lightbox */}
            {images.length > 1 && images.length <= 10 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto p-2 bg-black/50 rounded-lg">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      'relative w-16 h-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                      index === currentIndex
                        ? 'border-white ring-2 ring-white'
                        : 'border-transparent hover:border-white/50'
                    )}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Vai all'immagine ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`Miniatura ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard hints */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-xs flex gap-4">
                <span>← → Naviga</span>
                <span>ESC Chiudi</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
