import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MarketplaceItemLoading() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-12 w-32 mb-4" />
              <Skeleton className="h-6 w-40" />
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
