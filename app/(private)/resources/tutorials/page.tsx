import { requireVerifiedResident } from '@/lib/auth/dal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/molecules/empty-state';
import { getTutorials } from '@/app/actions/resources';
import { Video, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Tutorial',
  description: 'Guide e tutorial per la community',
};

export default async function TutorialsPage() {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();
  const { tutorials } = await getTutorials();

  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Tutorial</h1>
        <p className="text-lg text-muted-foreground">
          Guide e tutorial per utilizzare i servizi della community
        </p>
      </div>

      {tutorials.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Nessun tutorial disponibile"
          description="Al momento non ci sono tutorial pubblicati"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial: any) => (
            <Link key={tutorial.id} href={`/resources/tutorials/${tutorial.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                {tutorial.cover_image && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                    <img
                      src={tutorial.cover_image}
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {tutorial.content.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{tutorial.category}</Badge>
                    <Badge
                      variant={
                        tutorial.difficulty === 'beginner'
                          ? 'default'
                          : tutorial.difficulty === 'intermediate'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {tutorial.difficulty === 'beginner' && 'Principiante'}
                      {tutorial.difficulty === 'intermediate' && 'Intermedio'}
                      {tutorial.difficulty === 'advanced' && 'Avanzato'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{tutorial.estimated_time} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{tutorial.views_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
