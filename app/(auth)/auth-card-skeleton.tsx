import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for auth cards
 * Used as Suspense fallback in auth pages (login, register, forgot-password)
 */
export function AuthCardSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
      <CardHeader className="space-y-4 text-center pb-2">
        <Skeleton className="h-8 w-32 mx-auto rounded-full" />
        <Skeleton className="h-4 w-48 mx-auto rounded-full" />
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-8" />
      </CardContent>
    </Card>
  );
}
