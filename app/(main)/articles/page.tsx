import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FileText } from 'lucide-react';

import { getPublishedArticles } from '@/app/actions/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/molecules/empty-state';
import { getInitials, getShortName } from '@/lib/utils/format';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Articoli - Prato Rinaldo',
  description: 'Gli ultimi articoli e aggiornamenti dalla community di Prato Rinaldo',
};

export default async function ArticlesPage() {
  const { articles } = await getPublishedArticles();

  return (
    <div className="container py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Articoli</h1>
        <p className="text-muted-foreground">
          Scopri gli ultimi articoli e aggiornamenti dalla community
        </p>
      </div>

      {/* Articles Grid or Empty State */}
      {!articles || articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nessun articolo disponibile"
          description="Al momento non ci sono articoli pubblicati."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`${ROUTES.ARTICLES}/${article.slug}`}
              className="group"
            >
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                {article.cover_image && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  {article.excerpt && (
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>

                {/* Author & Date */}
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={article.author?.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(article.author?.name || 'A')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{getShortName(article.author?.name || '')}</span>
                    <span>·</span>
                    <span>
                      {format(new Date(article.published_at), 'dd MMM yyyy', { locale: it })}
                    </span>
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
