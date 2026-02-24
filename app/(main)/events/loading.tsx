import { Skeleton } from '@/components/ui/skeleton';

export default function EventsLoading() {
  return (
    <div className="container py-8 pb-24">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full hidden md:block" />
        </div>
      </div>
      {/* Calendar skeleton */}
      <div className="mb-6">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      {/* Event cards */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border bg-white">
            <div className="flex gap-4 p-4">
              <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
