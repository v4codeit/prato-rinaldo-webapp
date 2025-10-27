'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/molecules/empty-state';
import { getCategoryById, getThreadsByCategory } from '@/app/actions/forum';
import { MessageSquare, Eye, Pin, Lock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForumCategoryPage({ params }: { params: { categoryId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    subscribeToThreads();
  }, [params.categoryId]);

  async function loadData() {
    setLoading(true);

    const [categoryResult, threadsResult] = await Promise.all([
      getCategoryById(params.categoryId),
      getThreadsByCategory(params.categoryId),
    ]);

    if (categoryResult.category) setCategory(categoryResult.category);
    if (threadsResult.threads) setThreads(threadsResult.threads);

    setLoading(false);
  }

  function subscribeToThreads() {
    const supabase = createClient();

    const channel = supabase
      .channel(`category-${params.categoryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_threads',
          filter: `category_id=eq.${params.categoryId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Categoria non trovata</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted-foreground">{category.description}</p>
        {category.is_private && (
          <Badge variant="secondary" className="mt-2">
            <Lock className="h-3 w-3 mr-1" />
            Solo utenti verificati
          </Badge>
        )}
      </div>

      <div className="mb-6 flex justify-end">
        <Button asChild>
          <Link href={`/forum/${params.categoryId}/new`}>
            Nuova Discussione
          </Link>
        </Button>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nessuna discussione"
          description="Sii il primo a iniziare una discussione in questa categoria!"
          action={
            <Button asChild>
              <Link href={`/forum/${params.categoryId}/new`}>
                Nuova Discussione
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread: any) => (
            <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {thread.is_pinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <CardTitle className="text-lg">{thread.title}</CardTitle>
                        {thread.is_locked && (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Chiusa
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {thread.content}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <img
                            src={thread.author?.avatar || '/default-avatar.png'}
                            alt={thread.author?.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{thread.author?.name}</span>
                        </div>
                        <span>
                          {new Date(thread.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.views_count}</span>
                      </div>
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
