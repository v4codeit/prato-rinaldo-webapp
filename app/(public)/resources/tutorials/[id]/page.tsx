'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { getTutorialById, incrementTutorialViews } from '@/app/actions/resources';
import { Clock, Eye, User } from 'lucide-react';

export default function TutorialDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [tutorial, setTutorial] = useState<any>(null);

  useEffect(() => {
    loadData();
    incrementTutorialViews(params.id);
  }, [params.id]);

  async function loadData() {
    const result = await getTutorialById(params.id);

    if (result.tutorial) {
      setTutorial(result.tutorial);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!tutorial) {
    notFound();
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{tutorial.title}</h1>
          <div className="flex items-center gap-4 flex-wrap mb-4">
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
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{tutorial.estimated_time} minuti</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{tutorial.views_count} visualizzazioni</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={tutorial.author?.avatar || '/default-avatar.png'}
              alt={tutorial.author?.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-muted-foreground">
              di {tutorial.author?.name}
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {tutorial.cover_image && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border">
            <img
              src={tutorial.cover_image}
              alt={tutorial.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Video */}
        {tutorial.video_url && (
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={tutorial.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenuto</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: tutorial.content }}
            />
          </CardContent>
        </Card>

        {/* Author Bio */}
        {tutorial.author?.bio && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <img
                  src={tutorial.author.avatar || '/default-avatar.png'}
                  alt={tutorial.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{tutorial.author.name}</p>
                  <p className="text-sm text-muted-foreground">{tutorial.author.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
