import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProposalTagBadgeProps {
  tag: {
    name: string;
    color: string;
    icon?: string | null;
  };
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

/**
 * ProposalTagBadge - Compact tag display for proposal cards and detail pages
 *
 * Usage:
 * ```tsx
 * // In card list (small)
 * <ProposalTagBadge tag={{ name: "Online", color: "#3b82f6", icon: "🌐" }} size="sm" />
 *
 * // In detail page (medium)
 * <ProposalTagBadge tag={{ name: "Online", color: "#3b82f6", icon: "🌐" }} size="md" />
 *
 * // Icon only (compact spaces)
 * <ProposalTagBadge tag={{ name: "Online", color: "#3b82f6", icon: "🌐" }} showIcon={true} size="sm" />
 * ```
 */
export function ProposalTagBadge({
  tag,
  size = 'sm',
  showIcon = true,
  className,
}: ProposalTagBadgeProps) {
  const { name, color, icon } = tag;

  // Validate hex color format
  const isValidColor = /^#[0-9A-F]{6}$/i.test(color);
  const safeColor = isValidColor ? color : '#3b82f6'; // fallback to blue

  // Convert hex to RGB for opacity support
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }; // fallback to blue
  };

  const rgb = hexToRgb(safeColor);
  const bgColor = `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0.15)`; // 15% opacity
  const borderColor = `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0.3)`; // 30% opacity for border

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center gap-1 rounded-full border font-medium transition-colors',
        // Size variants
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-1 text-xs',
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: safeColor,
      }}
      aria-label={`Tag: ${name}`}
    >
      {/* Icon */}
      {showIcon && icon && (
        <span className="leading-none" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Name - hidden on sm size if icon exists and space is limited */}
      <span className="leading-none">{name}</span>
    </span>
  );
}

/**
 * ProposalTagBadgeGroup - Wrapper for multiple tags with proper spacing
 *
 * Usage:
 * ```tsx
 * <ProposalTagBadgeGroup>
 *   <ProposalTagBadge tag={tag1} />
 *   <ProposalTagBadge tag={tag2} />
 *   <ProposalTagBadge tag={tag3} />
 * </ProposalTagBadgeGroup>
 * ```
 */
export function ProposalTagBadgeGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>{children}</div>
  );
}
