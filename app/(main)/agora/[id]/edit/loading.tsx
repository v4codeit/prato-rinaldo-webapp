import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Proposal Edit Page
 * Matches the structure of the edit form
 */
export default function ProposalEditLoading() {
  return (
    <div className="container max-w-4xl py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
