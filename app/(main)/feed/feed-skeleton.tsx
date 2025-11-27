import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedSkeleton() {
  return (
    <div className="container py-8">
      {/* 3-Column Layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Filters (Desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-32">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-[100px]" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Center: Feed */}
        <main className="lg:col-span-6 space-y-4">
          {/* Mobile Filters skeleton */}
          <div className="lg:hidden mb-4 flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>

          {/* Feed Items skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-8 w-[60px]" />
                  <Skeleton className="h-8 w-[60px]" />
                  <Skeleton className="h-8 w-[60px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </main>

        {/* Right Sidebar skeleton (Desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-32">
            <Skeleton className="h-[100px] w-full rounded-lg" />
          </div>
        </aside>
      </div>
    </div>
  );
}
