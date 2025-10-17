import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileLoadingSkeleton() {
  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <div className="w-24 h-24 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-300 rounded-t animate-pulse"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 w-16 bg-gray-300 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* Content Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

