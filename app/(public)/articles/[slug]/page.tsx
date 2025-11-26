import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowLeft, Edit } from 'lucide-react';

import { getArticleBySlug, getArticleBySlugWithPreview } from '@/app/actions/articles';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils/format';
import { ROUTES } from '@/lib/utils/constants';

// Metadata generation for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { article } = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Articolo non trovato',
    };
  }

  return {
    title: `${article.title} - Prato Rinaldo`,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      images: article.cover_image ? [article.cover_image] : [],
      type: 'article',
      publishedTime: article.published_at,
    },
  };
}

export default async function ArticleDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || ROUTES.ARTICLES;
  const isPreview = search.preview === 'true';

  // Fetch article (with or without preview)
  const { article } = isPreview
    ? await getArticleBySlugWithPreview(slug)
    : await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Check if current user can edit (admin only)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    canEdit = !!(profile?.role && ['admin', 'super_admin'].includes(profile.role));
  }

  return (
    <div className="container py-6 md:py-12">
      {/* Preview Warning Banner */}
      {isPreview && article.status !== 'published' && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTitle className="flex items-center gap-2">
            👁️ Modalità Anteprima
          </AlertTitle>
          <AlertDescription>
            Questa è una bozza visibile solo agli amministratori.
            <Badge variant="secondary" className="ml-2">
              {article.status === 'draft' ? 'Bozza' : 'Archiviato'}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={returnTo as never}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Articoli
          </Link>
        </Button>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {article.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.author?.avatar ?? undefined} />
                <AvatarFallback>
                  {getInitials(article.author?.name || 'A')}
                </AvatarFallback>
              </Avatar>
              <span>{article.author?.name || 'Anonimo'}</span>
            </div>
            <span>·</span>
            <span>
              {format(
                new Date(article.published_at || article.created_at),
                'PPP',
                { locale: it }
              )}
            </span>
            {canEdit && (
              <>
                <span>·</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`${ROUTES.ADMIN_ARTICLES}?edit=${article.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {article.cover_image && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
            <Image
              src={article.cover_image}
              alt={article.title}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 896px, 896px"
            />
          </div>
        )}

        {/* Excerpt (if available) */}
        {article.excerpt && (
          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed italic text-muted-foreground">
                {article.excerpt}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </CardContent>
        </Card>

        {/* Author Bio */}
        {article.author?.bio && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sull'autore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={article.author.avatar ?? undefined} />
                  <AvatarFallback>
                    {getInitials(article.author.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{article.author.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {article.author.bio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button - Bottom */}
        <div className="pt-8 border-t">
          <Button className="w-full" variant="outline" asChild>
            <Link href={returnTo as never}>
              Torna agli Articoli
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
