'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { getThreadById, createPost, incrementThreadViews } from '@/app/actions/forum';
import { Pin, Lock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function ThreadDetailPage({ params }: { params: { threadId: string } }) {
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    incrementThreadViews(params.threadId);
    subscribeToReplies();
  }, [params.threadId]);

  async function loadData() {
    const result = await getThreadById(params.threadId);

    if (result.thread) {
      setThread(result.thread);
      setPosts(result.posts || []);
    }

    setLoading(false);
  }

  function subscribeToReplies() {
    const supabase = createClient();

    const channel = supabase
      .channel(`thread-${params.threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts',
          filter: `thread_id=eq.${params.threadId}`,
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

  async function handleSubmitReply(formData: FormData) {
    setSubmitting(true);

    const result = await createPost(params.threadId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Risposta pubblicata');
      setShowReplyForm(false);
      loadData();
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Discussione non trovata</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Thread Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <img
                src={thread.author?.avatar || '/default-avatar.png'}
                alt={thread.author?.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                  <CardTitle className="text-2xl">{thread.title}</CardTitle>
                  {thread.is_locked && (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Chiusa
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{thread.author?.name}</span>
                  <span>•</span>
                  <span>{new Date(thread.created_at).toLocaleDateString('it-IT')}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{thread.views_count} visualizzazioni</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
          </CardContent>
        </Card>

        {/* Posts */}
        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Risposte ({posts.length})</h2>
            {posts.map((post: any) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <img
                      src={post.author?.avatar || '/default-avatar.png'}
                      alt={post.author?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{post.author?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {post.author?.bio && (
                        <p className="text-xs text-muted-foreground">{post.author.bio}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {!thread.is_locked && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rispondi alla discussione</CardTitle>
            </CardHeader>
            <CardContent>
              {!showReplyForm ? (
                <Button onClick={() => setShowReplyForm(true)}>
                  Scrivi una risposta
                </Button>
              ) : (
                <form action={handleSubmitReply} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">
                      Messaggio <span className="text-destructive">*</span>
                    </Label>
                    <textarea
                      id="content"
                      name="content"
                      required
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                      placeholder="Scrivi la tua risposta..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Invio...' : 'Pubblica Risposta'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReplyForm(false)}
                      disabled={submitting}
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
