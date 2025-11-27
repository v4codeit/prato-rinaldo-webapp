import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for topic chat page
 */
export function TopicChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Sidebar skeleton - hidden on mobile */}
      <div className="hidden md:flex w-80 border-r flex-col">
        <div className="p-4 border-b space-y-3">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-5 w-5 md:hidden" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex gap-3 ${i % 3 === 0 ? 'flex-row-reverse' : ''}`}
            >
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className={`space-y-2 ${i % 3 === 0 ? 'items-end' : ''}`}>
                {i % 3 !== 0 && <Skeleton className="h-3 w-20" />}
                <Skeleton
                  className={`h-14 rounded-lg ${
                    i % 2 === 0 ? 'w-48' : 'w-64'
                  }`}
                />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
