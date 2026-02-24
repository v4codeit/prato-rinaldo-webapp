import Image from 'next/image';
import { APP_NAME } from '@/lib/utils/constants';

/**
 * LoadingHeader - Skeleton UI for Header during Suspense loading
 *
 * This component provides a loading state for the Header component
 * while user authentication data is being fetched in Server Components.
 *
 * Pattern: Used as Suspense fallback in layout files
 * <Suspense fallback={<LoadingHeader />}>
 *   <LayoutContent>{children}</LayoutContent>
 * </Suspense>
 */
export function LoadingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - Always visible, no loading needed */}
        <div className="flex items-center space-x-3">
          <Image
            src="/assets/logos/logo-pratorinaldo.png"
            alt={APP_NAME}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
            sizes="40px"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARklEQVQYlWP4z8DwHwMDAxMDFGBIMPxnYGBgYmJi+M/AwMDEwMDAxMDAwMTAwMBARQUTA8N/BgYGJiYmhv8MDAyMVFQAALOYCAvzJJHRAAAAAElFTkSuQmCC"
          />
          <span className="text-xl font-bold">{APP_NAME}</span>
        </div>

        {/* Desktop Navigation - Skeleton */}
        <nav className="hidden md:flex items-center space-x-6" aria-hidden="true">
          {/* Skeleton nav items */}
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </nav>

        {/* Auth Section - Skeleton */}
        <div className="hidden md:flex items-center space-x-4" aria-hidden="true">
          {/* Skeleton user avatar/buttons */}
          <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
        </div>

        {/* Mobile Menu Button - Skeleton */}
        <div className="md:hidden" aria-hidden="true">
          <div className="h-9 w-9 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  );
}
