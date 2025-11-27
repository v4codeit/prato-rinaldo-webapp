import { Suspense } from 'react';
import { getArticleBySlug } from '@/app/actions/articles';
import { ArticleContent } from './article-content';
import { ArticleSkeleton } from './article-skeleton';
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

  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <ArticleContent slug={slug} returnTo={returnTo} isPreview={isPreview} />
    </Suspense>
  );
}
