'use client';

import * as React from 'react';
import { Heart, Award, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';

export interface DonationBadgeProps {
  /** Badge display variant */
  variant?: 'full' | 'compact' | 'icon' | 'dot';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional donation amount for display */
  amount?: number;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Badge "Supporta il Comitato" shown on Mercatino items
 * when the seller has donated a percentage to the community
 */
export function DonationBadge({
  variant = 'compact',
  size = 'md',
  amount,
  showTooltip = true,
  className,
}: DonationBadgeProps) {
  const tooltipText = amount
    ? `Questo venditore ha donato €${amount.toFixed(2)} al Comitato!`
    : 'Questo venditore supporta il Comitato!';

  // Size classes
  const sizeClasses = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-[10px]',
      padding: 'px-1.5 py-0.5',
      badge: 'h-4',
      dot: 'w-3 h-3',
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-xs',
      padding: 'px-2 py-1',
      badge: 'h-6',
      dot: 'w-4 h-4',
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      badge: 'h-8',
      dot: 'w-5 h-5',
    },
  };

  const sizes = sizeClasses[size];

  // Render content based on variant
  const renderBadge = () => {
    switch (variant) {
      case 'full':
        return (
          <Badge
            className={cn(
              "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md shadow-amber-500/20",
              "hover:from-amber-600 hover:to-orange-600 transition-all",
              sizes.padding,
              sizes.text,
              className
            )}
          >
            <Award className={cn(sizes.icon, "mr-1.5")} />
            <span className="font-semibold">Supporta il Comitato</span>
            {amount && (
              <span className="ml-1.5 opacity-90">€{amount.toFixed(0)}</span>
            )}
          </Badge>
        );

      case 'compact':
        return (
          <Badge
            className={cn(
              "bg-amber-500 text-white border-0 shadow-sm",
              "hover:bg-amber-600 transition-colors",
              sizes.padding,
              sizes.text,
              className
            )}
          >
            <Heart className={cn(sizes.icon, "mr-1 fill-white")} />
            <span className="font-medium">Supporter</span>
          </Badge>
        );

      case 'icon':
        return (
          <div
            className={cn(
              "rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30",
              sizes.badge,
              "aspect-square",
              className
            )}
          >
            <Sparkles className={sizes.icon} />
          </div>
        );

      case 'dot':
        return (
          <div
            className={cn(
              "rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30",
              "ring-2 ring-white",
              sizes.dot,
              className
            )}
          />
        );

      default:
        return null;
    }
  };

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderBadge()}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-slate-900 text-white border-0 text-xs max-w-[200px]"
          >
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderBadge();
}

/**
 * Animated version for detail pages
 */
export function DonationBadgeAnimated({
  amount,
  className,
}: {
  amount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%]",
        "animate-[gradient_3s_ease-in-out_infinite]",
        "text-white font-semibold shadow-lg shadow-amber-500/25",
        className
      )}
    >
      {/* Sparkle effect */}
      <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />

      <Award className="h-5 w-5 relative z-10" />
      <span className="relative z-10">Supporta il Comitato</span>
      {amount && (
        <span className="relative z-10 bg-white/20 px-2 py-0.5 rounded-full text-sm">
          €{amount.toFixed(0)}
        </span>
      )}
    </div>
  );
}
