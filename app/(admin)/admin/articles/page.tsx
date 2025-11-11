import { ArticlesClient } from './articles-client';
import { getArticlesFiltered } from '@/app/actions/articles';

export const metadata = {
  title: 'Gestione Articoli - Admin',
  description: 'Gestisci tutti gli articoli della piattaforma',
};

export default async function ArticlesManagementPage() {
  // Fetch initial articles data
  const result = await getArticlesFiltered({
    offset: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    status: 'all',
  });

  return (
    <ArticlesClient
      initialData={result.articles as any[]}
      initialTotal={result.total}
    />
  );
}
