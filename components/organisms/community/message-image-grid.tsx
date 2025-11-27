'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import type { ImageAttachment } from '@/types/topics';

interface MessageImageGridProps {
  images: ImageAttachment[];
  isCurrentUser?: boolean;
  onImageClick: (index: number) => void;
  maxVisible?: number;
  className?: string;
}

/**
 * WhatsApp-style image grid for chat messages
 * - 1 image: full width
 * - 2 images: side by side
 * - 3 images: 1 large + 2 small
 * - 4+ images: 2x2 grid with "+N" overlay
 */
export function MessageImageGrid({
  images,
  isCurrentUser = false,
  onImageClick,
  maxVisible = 4,
  className,
}: MessageImageGridProps) {
  const count = images.length;
  const displayCount = Math.min(count, maxVisible);
  const extraCount = count - maxVisible;

  if (count === 0) return null;

  // Single image: full width
  if (count === 1) {
    return (
      <div className={cn('overflow-hidden rounded-lg', className)}>
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Image
            src={images[0].url}
            alt="Immagine"
            width={images[0].width || 400}
            height={images[0].height || 300}
            className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </button>
      </div>
    );
  }

  // 2 images: side by side
  if (count === 2) {
    return (
      <div className={cn('grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg', className)}>
        {images.slice(0, 2).map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onImageClick(index)}
            className="aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={img.url}
              alt={`Immagine ${index + 1}`}
              width={200}
              height={200}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </button>
        ))}
      </div>
    );
  }

  // 3 images: 1 large on top, 2 small on bottom
  if (count === 3) {
    return (
      <div className={cn('grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg', className)}>
        {/* First image spans both columns */}
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="col-span-2 aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Image
            src={images[0].url}
            alt="Immagine 1"
            width={400}
            height={225}
            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </button>
        {/* Two images side by side */}
        {images.slice(1, 3).map((img, index) => (
          <button
            key={index + 1}
            type="button"
            onClick={() => onImageClick(index + 1)}
            className="aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={img.url}
              alt={`Immagine ${index + 2}`}
              width={200}
              height={200}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </button>
        ))}
      </div>
    );
  }

  // 4+ images: 2x2 grid with optional "+N" overlay
  return (
    <div className={cn('grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg', className)}>
      {images.slice(0, displayCount).map((img, index) => {
        const isLastVisible = index === displayCount - 1;
        const showOverlay = isLastVisible && extraCount > 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onImageClick(index)}
            className="relative aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={img.url}
              alt={`Immagine ${index + 1}`}
              width={200}
              height={200}
              className={cn(
                'w-full h-full object-cover cursor-pointer transition-opacity',
                showOverlay ? 'brightness-50' : 'hover:opacity-95'
              )}
            />
            {showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{extraCount}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
