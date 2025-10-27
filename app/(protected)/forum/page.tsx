import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/molecules/empty-state';
import { getForumCategories } from '@/app/actions/forum';
import { MessageSquare, Lock, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Forum',
  description: 'Partecipa alle discussioni della community',
};

export default async function ForumPage() {
  const { categories } = await getForumCategories();

  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Forum</h1>
        <p className="text-lg text-muted-foreground">
          Partecipa alle discussioni della community
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nessuna categoria disponibile"
          description="Il forum non è ancora stato configurato"
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category: any) => (
            <Link key={category.id} href={`/forum/${category.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        {category.is_private && (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Privato
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {category.threads_count || 0}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
