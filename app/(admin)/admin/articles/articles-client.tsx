'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ROUTES } from '@/lib/utils/constants';
import { DataTable } from '@/components/admin/data-table';
import { FilterPanel } from '@/components/admin/filter-panel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  getArticlesFiltered,
  updateArticle,
  deleteArticle,
  type ArticlesFilterParams,
} from '@/app/actions/articles';
import { ArticleFormDialog } from './article-form-dialog';

interface ArticleWithAuthor {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface ArticlesClientProps {
  initialData: ArticleWithAuthor[];
  initialTotal: number;
}

export function ArticlesClient({ initialData, initialTotal }: ArticlesClientProps) {
  const router = useRouter();
  const [articles, setArticles] = React.useState<ArticleWithAuthor[]>(initialData);
  const [total, setTotal] = React.useState(initialTotal);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<ArticlesFilterParams>({
    offset: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    status: 'all',
  });

  // UI filter state (separate from API filters)
  const [uiFilters, setUiFilters] = React.useState<Record<string, any>>({
    search: '',
    status: 'all',
    hasCoverImage: 'all',
    createdFrom: '',
    createdTo: '',
    publishedFrom: '',
    publishedTo: '',
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [articleToDelete, setArticleToDelete] = React.useState<ArticleWithAuthor | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [articleToEdit, setArticleToEdit] = React.useState<ArticleWithAuthor | null>(null);

  // Fetch articles with filters
  const fetchArticles = React.useCallback(async (newFilters: ArticlesFilterParams) => {
    setIsLoading(true);
    try {
      const result = await getArticlesFiltered(newFilters);
      setArticles(result.articles as ArticleWithAuthor[]);
      setTotal(result.total);
    } catch (error) {
      toast.error('Errore nel caricamento degli articoli');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = React.useCallback((newFilters: Partial<ArticlesFilterParams>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    fetchArticles(updatedFilters);
  }, [filters, fetchArticles]);

  // Handle pagination
  const handlePageChange = React.useCallback((page: number) => {
    const offset = (page - 1) * (filters.limit || 20);
    const updatedFilters = { ...filters, offset };
    setFilters(updatedFilters);
    fetchArticles(updatedFilters);
  }, [filters, fetchArticles]);

  // Handle publish/unpublish toggle
  const handleTogglePublish = React.useCallback(async (article: ArticleWithAuthor) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const formData = new FormData();
    formData.append('title', article.title);
    formData.append('slug', article.slug);
    formData.append('excerpt', article.excerpt);
    formData.append('content', article.content);
    formData.append('coverImage', article.cover_image || '');
    formData.append('status', newStatus);

    const result = await updateArticle(article.id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        newStatus === 'published'
          ? 'Articolo pubblicato con successo'
          : 'Articolo rimosso dalla pubblicazione'
      );
      fetchArticles(filters);
    }
  }, [filters, fetchArticles]);

  // Handle delete
  const handleDeleteClick = React.useCallback((article: ArticleWithAuthor) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!articleToDelete) return;

    setIsDeleting(true);
    const result = await deleteArticle(articleToDelete.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Articolo eliminato con successo');
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
      fetchArticles(filters);
    }
    setIsDeleting(false);
  }, [articleToDelete, filters, fetchArticles]);

  // Handle create
  const handleCreate = React.useCallback(() => {
    setArticleToEdit(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = React.useCallback((article: ArticleWithAuthor) => {
    setArticleToEdit(article);
    setFormDialogOpen(true);
  }, []);

  // Navigate to view page
  const handleView = React.useCallback((article: ArticleWithAuthor) => {
    const isPublished = article.status === 'published';
    const url = isPublished
      ? `${ROUTES.ARTICLES}/${article.slug}`
      : `${ROUTES.ARTICLES}/${article.slug}?preview=true`;

    // Open in new tab
    window.open(url, '_blank');
  }, []);

  // DataTable columns
  const columns = React.useMemo(() => [
    {
      key: 'cover_image',
      header: 'Immagine',
      render: (article: ArticleWithAuthor) => (
        article.cover_image ? (
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            N/A
          </div>
        )
      ),
    },
    {
      key: 'title',
      header: 'Titolo',
      render: (article: ArticleWithAuthor) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{article.title}</div>
          <div className="text-xs text-muted-foreground truncate">{article.excerpt}</div>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Autore',
      render: (article: ArticleWithAuthor) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={article.author.avatar} alt={article.author.name} />
            <AvatarFallback>{article.author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{article.author.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Stato',
      render: (article: ArticleWithAuthor) => {
        const statusMap = {
          draft: { label: 'Bozza', variant: 'secondary' as const },
          published: { label: 'Pubblicato', variant: 'default' as const },
          archived: { label: 'Archiviato', variant: 'outline' as const },
        };
        const status = statusMap[article.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Creato',
      render: (article: ArticleWithAuthor) => (
        <div className="text-sm">
          {new Date(article.created_at).toLocaleDateString('it-IT')}
        </div>
      ),
    },
    {
      key: 'published_at',
      header: 'Pubblicato',
      render: (article: ArticleWithAuthor) => (
        <div className="text-sm">
          {article.published_at
            ? new Date(article.published_at).toLocaleDateString('it-IT')
            : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (article: ArticleWithAuthor) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(article)}>
              <Eye className="w-4 h-4 mr-2" />
              {article.status === 'published' ? 'Visualizza' : 'Anteprima'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(article)}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifica
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTogglePublish(article)}>
              {article.status === 'published' ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rimuovi dalla pubblicazione
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pubblica
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteClick(article)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleEdit, handleView, handleTogglePublish, handleDeleteClick]);

  // Filter fields
  const filterFields = React.useMemo(() => [
    {
      type: 'text' as const,
      key: 'search',
      label: 'Cerca',
      placeholder: 'Cerca per titolo o contenuto...',
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Stato',
      options: [
        { value: 'all', label: 'Tutti' },
        { value: 'draft', label: 'Bozze' },
        { value: 'published', label: 'Pubblicati' },
        { value: 'archived', label: 'Archiviati' },
      ],
    },
    {
      type: 'select' as const,
      key: 'hasCoverImage',
      label: 'Immagine di copertina',
      options: [
        { value: 'all', label: 'Tutti' },
        { value: 'true', label: 'Con immagine' },
        { value: 'false', label: 'Senza immagine' },
      ],
    },
    {
      type: 'date-range' as const,
      key: 'created',
      label: 'Data creazione',
      fromKey: 'createdFrom',
      toKey: 'createdTo',
    },
    {
      type: 'date-range' as const,
      key: 'published',
      label: 'Data pubblicazione',
      fromKey: 'publishedFrom',
      toKey: 'publishedTo',
    },
  ], []);

  // Handle UI filter changes
  const handleUiFilterChange = React.useCallback((filterValues: Record<string, any>) => {
    setUiFilters(filterValues);

    // Convert UI filters to API filters
    const newFilters: Partial<ArticlesFilterParams> = {};

    if (filterValues.search) {
      newFilters.search = filterValues.search;
    }

    if (filterValues.status && filterValues.status !== 'all') {
      newFilters.status = filterValues.status as 'draft' | 'published' | 'archived';
    }

    if (filterValues.hasCoverImage && filterValues.hasCoverImage !== 'all') {
      newFilters.hasCoverImage = filterValues.hasCoverImage === 'true';
    }

    if (filterValues.createdFrom) {
      newFilters.createdFrom = filterValues.createdFrom;
    }

    if (filterValues.createdTo) {
      newFilters.createdTo = filterValues.createdTo;
    }

    if (filterValues.publishedFrom) {
      newFilters.publishedFrom = filterValues.publishedFrom;
    }

    if (filterValues.publishedTo) {
      newFilters.publishedTo = filterValues.publishedTo;
    }

    handleFilterChange(newFilters);
  }, [handleFilterChange]);

  // Calculate pagination
  const pageSize = filters.limit || 20;
  const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1;

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Articoli</h1>
          <p className="text-muted-foreground">
            Gestisci tutti gli articoli della piattaforma
          </p>
        </div>
        <Button onClick={handleCreate}>
          Nuovo Articolo
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel
        fields={filterFields}
        filters={uiFilters}
        onFilterChange={handleUiFilterChange}
      />

      {/* Data Table */}
      <DataTable
        data={articles}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nessun articolo trovato"
        pagination={{
          page: currentPage,
          pageSize,
          total,
          onPageChange: handlePageChange,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'articolo &quot;{articleToDelete?.title}&quot;?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Article Form Dialog (Create/Edit) */}
      <ArticleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        article={articleToEdit ? {
          id: articleToEdit.id,
          title: articleToEdit.title,
          slug: articleToEdit.slug,
          excerpt: articleToEdit.excerpt,
          content: articleToEdit.content,
          cover_image: articleToEdit.cover_image,
          status: articleToEdit.status,
        } : null}
        onSuccess={() => {
          fetchArticles(filters);
          setArticleToEdit(null);
        }}
      />
    </div>
  );
}
