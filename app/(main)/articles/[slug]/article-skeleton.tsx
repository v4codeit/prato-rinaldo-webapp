import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ArticleSkeleton() {
  return (
    <div className="container py-6 md:py-12">
      {/* Back Navigation */}
      <div className="mb-6">
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />

          {/* Metadata Bar */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </header>

        {/* Cover Image */}
        <Skeleton className="aspect-video w-full rounded-xl" />

        {/* Excerpt */}
        <Card className="bg-muted/50 border-none">
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4 mt-2" />
          </CardContent>
        </Card>

        {/* Article Content */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>

        {/* Author Bio */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[100px]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button - Bottom */}
        <div className="pt-8 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </article>
    </div>
  );
}
