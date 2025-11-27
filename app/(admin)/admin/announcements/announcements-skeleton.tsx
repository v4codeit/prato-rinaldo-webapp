import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnnouncementsSkeleton() {
  return (
    <AdminPageLayout
      title="Gestione Annunci"
      description="Gestisci banner e annunci del mobile menu"
    >
      <div className="space-y-4">
        {/* Header with button */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>

        {/* Announcements list */}
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-[60px] rounded-full" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminPageLayout>
  );
}
