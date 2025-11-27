import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EventSkeleton() {
  return (
    <div className="container py-6 md:py-12">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Skeleton className="h-9 w-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <Skeleton className="aspect-video w-full rounded-lg lg:rounded-xl" />

            {/* Title and Badges */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-[100px] rounded-full" />
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-[120px]" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>

            {/* Organizer */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-[140px]" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-[50px]" />
                    <Skeleton className="h-5 w-[180px]" />
                  </div>
                </div>

                {/* Attendees */}
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-[120px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            {/* Back Button */}
            <Skeleton className="h-10 w-full hidden lg:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
