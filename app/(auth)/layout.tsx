import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { AuthLayoutContent } from './auth-layout-content';

/**
 * Auth Layout - Wrapper for login/register pages with Suspense
 *
 * Uses Suspense boundary to handle async auth checks (redirectIfAuthenticated).
 * Pattern: Layout (sync) → Suspense → AuthLayoutContent (async) → Children
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
          />
          <h1 className="text-2xl font-bold text-center">{APP_NAME}</h1>
        </Link>

        {/* Auth Card - wrapped in Suspense for async auth check */}
        <Suspense fallback={<AuthCardSkeleton />}>
          <AuthLayoutContent>{children}</AuthLayoutContent>
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for auth card
 */
function AuthCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
