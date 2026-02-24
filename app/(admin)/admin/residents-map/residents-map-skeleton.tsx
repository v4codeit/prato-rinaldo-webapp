import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ResidentsMapSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-3 w-[80px]" />
              <Skeleton className="h-7 w-[50px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[160px]" />
        </CardContent>
      </Card>

      {/* Map placeholder */}
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-[350px] w-full rounded-lg md:h-[500px]" />
        </CardContent>
      </Card>
    </div>
  );
}
