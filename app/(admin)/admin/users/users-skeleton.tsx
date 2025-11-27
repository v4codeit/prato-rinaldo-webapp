import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UsersSkeleton() {
  return (
    <AdminPageLayout
      title="Gestione Utenti"
      description="Visualizza e gestisci tutti gli utenti della piattaforma"
    >
      <div className="space-y-4">
        {/* Filters skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
          </CardHeader>
        </Card>

        {/* Table skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Table header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>

              {/* Table rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
