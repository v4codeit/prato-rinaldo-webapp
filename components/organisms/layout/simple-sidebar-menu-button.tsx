'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils/cn';

interface SimpleSidebarMenuButtonProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
  isActive?: boolean;
}

/**
 * Simplified version of SidebarMenuButton that doesn't depend on useSidebar hook.
 * Used in custom fixed sidebar layout without SidebarProvider.
 */
export const SimpleSidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SimpleSidebarMenuButtonProps
>(({ asChild = false, isActive = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        // Base styles - Larger font and spacing for better readability
        "flex w-full items-center gap-3 rounded-md p-2.5 text-left text-base",
        "transition-colors duration-200",

        // Hover state
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",

        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",

        // Active state (current route)
        "data-[active=true]:bg-sidebar-accent",
        "data-[active=true]:font-medium",
        "data-[active=true]:text-sidebar-accent-foreground",

        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",

        // Icon sizing - Slightly larger for better visibility
        "[&>svg]:size-5 [&>svg]:shrink-0",

        // Text truncation
        "[&>span]:truncate",

        className
      )}
      {...props}
    />
  );
});

SimpleSidebarMenuButton.displayName = 'SimpleSidebarMenuButton';
