import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTutorialById, incrementTutorialViews } from '@/app/actions/resources';
import { Clock, Eye } from 'lucide-react';
import Image from 'next/image';
import { getShortName } from '@/lib/utils/format';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTutorialById(id);

  if (!result.tutorial) {
    return {
      title: 'Tutorial non trovato',
    };
  }

  return {
    title: `${result.tutorial.title} - Tutorial`,
    description: 'Tutorial della community di Prato Rinaldo',
  };
}

export default async function TutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTutorialById(id);

  if (!result.tutorial) {
    notFound();
  }

  const tutorial = result.tutorial;

  // Increment views (fire and forget - don't await)
  incrementTutorialViews(id).catch(() => {});

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
            <Image
              src={tutorial.author?.avatar || '/default-avatar.png'}
              alt={tutorial.author?.name || 'Author'}
              width={32}
              height={32}
              className="rounded-full"
              sizes="32px"
            />
            <span className="text-sm text-muted-foreground">
              di {getShortName(tutorial.author?.name || '')}
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {tutorial.cover_image && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border relative">
            <Image
              src={tutorial.cover_image}
              alt={tutorial.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 896px"
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
                <Image
                  src={tutorial.author.avatar || '/default-avatar.png'}
                  alt={tutorial.author.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                  sizes="48px"
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
