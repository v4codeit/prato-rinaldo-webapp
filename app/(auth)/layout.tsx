import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';

/**
 * Auth Layout - Visual wrapper for login/register/forgot-password pages
 *
 * This is a pure visual wrapper without auth logic.
 * Each page handles its own auth checks via page-level Suspense.
 *
 * Pattern: Layout (sync, visual only) → Page (Suspense) → Content (async auth) → Form
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/50 p-4">
      {/* Back to Home Button - Top Left */}
      <Button
        variant="outline"
        size="sm"
        asChild
        className="absolute top-4 left-4 hover:bg-primary/10 hover:text-primary hover:border-primary"
        aria-label="Torna alla Home"
      >
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo centrato */}
        <Link href={ROUTES.HOME} className="flex flex-col items-center space-y-3">
          <Image
            src="/assets/logos/logo-pratorinaldo.png"
            alt={APP_NAME}
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            priority
            sizes="80px"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARklEQVQYlWP4z8DwHwMDAxMDFGBIMPxnYGBgYmJi+M/AwMDEwMDAxMDAwMTAwMBARQUTA8N/BgYGJiYmhv8MDAyMVFQAALOYCAvzJJHRAAAAAElFTkSuQmCC"
          />
          <h1 className="text-2xl font-bold text-center">{APP_NAME}</h1>
        </Link>

        {/* Auth Card - each page handles its own Suspense */}
        {children}
      </div>
    </div>
  );
}
