import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/utils/constants';

export function UserDetailSkeleton() {
  return (
    <AdminPageLayout
      backLink={{ href: ROUTES.ADMIN_USERS, label: 'Torna agli utenti' }}
    >
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3 text-center md:text-left">
                <Skeleton className="h-8 w-[250px] mx-auto md:mx-0" />
                <Skeleton className="h-4 w-[200px] mx-auto md:mx-0" />
                <Skeleton className="h-4 w-[150px] mx-auto md:mx-0" />
                <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                  <Skeleton className="h-6 w-[100px] rounded-full" />
                  <Skeleton className="h-6 w-[90px] rounded-full" />
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
                  <Skeleton className="h-9 w-[100px]" />
                  <Skeleton className="h-9 w-[100px]" />
                  <Skeleton className="h-9 w-[120px]" />
                  <Skeleton className="h-9 w-[120px]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-[140px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 + i % 2 }).map((_, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-[80px]" />
                        <Skeleton className="h-4 w-[160px]" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Ruoli card */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-[150px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-[80px]" />
                      <Skeleton className="h-6 w-[100px] rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Attivita card */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-[100px]" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2 rounded-lg border p-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-[30px]" />
                        <Skeleton className="h-3 w-[60px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Badge card */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-[120px]" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 rounded-lg border p-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-3 w-[140px]" />
                    </div>
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sistema card */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-[80px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-[100px]" />
                      <Skeleton className="h-4 w-[140px]" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
