# ARTICLES CRUD - PIANO IMPLEMENTAZIONE ULTRA-DETTAGLIATO

**Modalità:** ULTRATHINK + Surgical Precision
**Scope:** Day 3-4 - Articles CRUD Interface Complete
**Timeline:** 8-10 ore (suddivise in 47 step)
**Status:** Ready to Execute

---

## EXECUTIVE SUMMARY

Basandoci sull'analisi completa di 5 agenti specializzati, implementeremo:

1. **getArticlesFiltered()** server action (1 ora)
2. **slug-generator utility** ✅ COMPLETATO
3. **ArticlesClient** con DataTable (2 ore)
4. **ArticleFormDialog** con RichTextEditor (3 ore)
5. **Integration & Testing** (2 ore)

**Total Files:** 7 nuovi + 2 modificati
**Total Lines:** ~1,850 righe di codice production-ready

---

## DEPENDENCIES TREE

```
slug-generator.ts (✅ COMPLETATO)
    ↓
articles.ts (getArticlesFiltered) ← STEP 1
    ↓
articles-client.tsx ← STEP 2
    ↓
article-form-dialog.tsx ← STEP 3
    ↓
page.tsx (integration) ← STEP 4
    ↓
Testing ← STEP 5
```

---

## PHASE 1: SERVER ACTION (60 minuti)

### STEP 1.1: Aggiungi getArticlesFiltered() ad articles.ts

**File:** `app/actions/articles.ts`
**Azione:** Add function
**Righe da aggiungere:** ~120 righe
**Tempo:** 30 minuti

**Codice esatto da inserire (dopo deleteArticle function):**

```typescript
// ============================================
// GET ARTICLES FILTERED (ADMIN)
// ============================================

export interface ArticlesFilterParams {
  offset?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived' | 'all';
  authorId?: string;
  createdFrom?: string;
  createdTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
  hasCoverImage?: boolean;
  sortBy?: 'created_at' | 'published_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ArticlesFilterResponse {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image: string | null;
    status: 'draft' | 'published' | 'archived';
    author_id: string;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Get filtered articles with pagination (Admin only)
 * Supports: search, status filter, author filter, date range, sorting
 */
export async function getArticlesFiltered(
  filters: ArticlesFilterParams = {}
): Promise<ArticlesFilterResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      articles: [],
      total: 0,
      offset: 0,
      limit: 0,
      hasMore: false,
    };
  }

  // Get user profile for role check and tenant_id
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return {
      articles: [],
      total: 0,
      offset: 0,
      limit: 0,
      hasMore: false,
    };
  }

  // Defaults
  const offset = filters.offset ?? 0;
  const limit = Math.min(filters.limit ?? 20, 100);
  const sortBy = filters.sortBy ?? 'created_at';
  const sortOrder = filters.sortOrder ?? 'desc';

  try {
    // Build query
    let query = supabase
      .from('articles')
      .select(
        `
        *,
        author:users!author_id (
          id,
          name,
          avatar
        )
        `,
        { count: 'exact' }
      )
      .eq('tenant_id', profile.tenant_id);

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply author filter
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }

    // Apply created date range
    if (filters.createdFrom) {
      query = query.gte('created_at', `${filters.createdFrom}T00:00:00Z`);
    }
    if (filters.createdTo) {
      query = query.lte('created_at', `${filters.createdTo}T23:59:59Z`);
    }

    // Apply published date range
    if (filters.publishedFrom) {
      query = query.gte('published_at', `${filters.publishedFrom}T00:00:00Z`);
    }
    if (filters.publishedTo) {
      query = query.lte('published_at', `${filters.publishedTo}T23:59:59Z`);
    }

    // Apply cover image filter
    if (filters.hasCoverImage === true) {
      query = query.not('cover_image', 'is', null);
    }

    // Apply text search
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return {
        articles: [],
        total: 0,
        offset,
        limit,
        hasMore: false,
      };
    }

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return {
      articles: data || [],
      total,
      offset,
      limit,
      hasMore,
    };
  } catch (error) {
    console.error('Unexpected error in getArticlesFiltered:', error);
    return {
      articles: [],
      total: 0,
      offset,
      limit,
      hasMore: false,
    };
  }
}
```

**Checkpoint 1.1:**
- [ ] Function added to articles.ts
- [ ] TypeScript compiles without errors
- [ ] Interfaces exported correctly

---

### STEP 1.2: Update createArticle() per usare slug generator

**File:** `app/actions/articles.ts`
**Azione:** Modify function
**Righe modificate:** 5-10 righe
**Tempo:** 15 minuti

**Aggiungi import:**
```typescript
import { generateUniqueSlug } from '@/lib/utils/slug-generator';
```

**Modifica createArticle() - replace lines 85-95 circa:**

```typescript
// OLD:
const articleData = {
  ...parsed.data,
  author_id: user.id,
  tenant_id: profile.tenant_id,
  published_at: parsed.data.status === 'published'
    ? new Date().toISOString()
    : null,
};

// NEW:
// Generate unique slug if not provided or empty
const finalSlug = parsed.data.slug || await generateUniqueSlug(
  parsed.data.title,
  profile.tenant_id
);

const articleData = {
  title: parsed.data.title,
  slug: finalSlug,
  excerpt: parsed.data.excerpt,
  content: parsed.data.content,
  cover_image: parsed.data.coverImage || null,
  status: parsed.data.status,
  author_id: user.id,
  tenant_id: profile.tenant_id,
  published_at: parsed.data.status === 'published'
    ? new Date().toISOString()
    : null,
};
```

**Checkpoint 1.2:**
- [ ] Import slug-generator
- [ ] createArticle() usa generateUniqueSlug()
- [ ] TypeScript compiles

---

### STEP 1.3: Update updateArticle() per usare slug generator

**File:** `app/actions/articles.ts`
**Azione:** Modify function
**Righe modificate:** 5-10 righe
**Tempo:** 15 minuti

**Modifica updateArticle() - replace lines 155-165 circa:**

```typescript
// OLD:
const updateData = {
  ...parsed.data,
  published_at: parsed.data.status === 'published'
    ? new Date().toISOString()
    : null,
};

// NEW:
// Regenerate slug if title changed
const finalSlug = parsed.data.slug || await generateUniqueSlug(
  parsed.data.title,
  profile.tenant_id,
  articleId  // Exclude current article from uniqueness check
);

const updateData = {
  title: parsed.data.title,
  slug: finalSlug,
  excerpt: parsed.data.excerpt,
  content: parsed.data.content,
  cover_image: parsed.data.coverImage || null,
  status: parsed.data.status,
  published_at: parsed.data.status === 'published'
    ? new Date().toISOString()
    : null,
};
```

**Checkpoint 1.3:**
- [ ] updateArticle() usa generateUniqueSlug()
- [ ] Exclude current article ID
- [ ] TypeScript compiles

---

## PHASE 2: ARTICLES CLIENT COMPONENT (120 minuti)

### STEP 2.1: Create articles-client.tsx

**File:** `app/(admin)/admin/articles/articles-client.tsx` (NUOVO)
**Righe:** ~450 righe
**Tempo:** 90 minuti

**Struttura completa del file:**

```typescript
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
} from '@/components/admin/data-table';
import { FilterPanel, type FilterField } from '@/components/admin/filter-panel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff, FileText, Plus } from 'lucide-react';
import { deleteArticle, updateArticle } from '@/app/actions/articles';
import { ArticleFormDialog } from './article-form-dialog';

// ============================================
// TYPES
// ============================================

interface Author {
  id: string;
  name: string;
  avatar: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author: Author | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticlesClientProps {
  articles: Article[];
  total: number;
  authors: Array<{ id: string; name: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getShortName(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ArticlesClient({
  articles: initialArticles,
  total: initialTotal,
  authors,
}: ArticlesClientProps) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // Filter state
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, any>>({});

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<Article | null>(null);

  // ============================================
  // FILTER FIELDS
  // ============================================

  const filterFields: FilterField[] = React.useMemo(() => {
    return [
      {
        type: 'select',
        key: 'status',
        label: 'Stato',
        placeholder: 'Tutti gli stati',
        allowAll: true,
        options: [
          { value: 'draft', label: 'Bozza' },
          { value: 'published', label: 'Pubblicato' },
          { value: 'archived', label: 'Archiviato' },
        ],
      },
      {
        type: 'select',
        key: 'author_id',
        label: 'Autore',
        placeholder: 'Tutti gli autori',
        allowAll: true,
        options: authors.map((author) => ({
          value: author.id,
          label: author.name,
        })),
      },
      {
        type: 'date-range',
        key: 'created_date_range',
        label: 'Periodo di Creazione',
        fromKey: 'created_from',
        toKey: 'created_to',
      },
      {
        type: 'date-range',
        key: 'published_date_range',
        label: 'Periodo di Pubblicazione',
        fromKey: 'published_from',
        toKey: 'published_to',
      },
      {
        type: 'checkbox',
        key: 'has_cover_image',
        label: 'Ha Immagine di Copertina',
        description: 'Mostra solo articoli con cover image',
      },
    ];
  }, [authors]);

  // ============================================
  // TABLE COLUMNS
  // ============================================

  const columns: DataTableColumn<Article>[] = [
    {
      key: 'title',
      header: 'Articolo',
      render: (article) => (
        <div>
          <div className="font-medium line-clamp-1">{article.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            /{article.slug}
          </div>
        </div>
      ),
    },
    {
      key: 'cover_image',
      header: 'Copertina',
      hiddenOnMobile: true,
      render: (article) => {
        if (!article.cover_image) {
          return (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          );
        }
        return (
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-12 h-12 rounded object-cover"
          />
        );
      },
    },
    {
      key: 'author',
      header: 'Autore',
      hiddenOnMobile: true,
      render: (article) => {
        if (!article.author) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.author.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(article.author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{getShortName(article.author.name)}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Stato',
      hiddenOnMobile: true,
      render: (article) => {
        const statusConfig: Record<
          string,
          {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
          }
        > = {
          draft: { label: 'Bozza', variant: 'secondary' },
          published: { label: 'Pubblicato', variant: 'default' },
          archived: { label: 'Archiviato', variant: 'outline' },
        };
        const config = statusConfig[article.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'published_at',
      header: 'Pubblicato',
      hiddenOnMobile: true,
      render: (article) => {
        if (!article.published_at) {
          return <span className="text-muted-foreground">-</span>;
        }
        return new Date(article.published_at).toLocaleDateString('it-IT');
      },
    },
    {
      key: 'created_at',
      header: 'Creato',
      hiddenOnMobile: true,
      render: (article) =>
        new Date(article.created_at).toLocaleDateString('it-IT'),
    },
  ];

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleTogglePublish = async (
    articleId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const formData = new FormData();
    formData.set('status', newStatus);

    // We need to get the article data to pass all required fields
    const article = initialArticles.find((a) => a.id === articleId);
    if (!article) {
      toast.error('Articolo non trovato');
      return;
    }

    formData.set('title', article.title);
    formData.set('slug', article.slug);
    formData.set('content', article.content);
    if (article.excerpt) formData.set('excerpt', article.excerpt);
    if (article.cover_image) formData.set('coverImage', article.cover_image);

    const { error } = await updateArticle(articleId, formData);
    if (error) {
      toast.error(error);
    } else {
      toast.success(
        newStatus === 'published'
          ? 'Articolo pubblicato'
          : 'Articolo salvato come bozza'
      );
      router.refresh();
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo?')) return;

    const { error } = await deleteArticle(articleId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Articolo eliminato');
      router.refresh();
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
  };

  // ============================================
  // ROW ACTIONS
  // ============================================

  const rowActions: DataTableRowAction<Article>[] = [
    {
      label: 'Modifica',
      icon: Edit,
      onClick: handleEdit,
    },
    {
      label: 'Pubblica',
      icon: Eye,
      onClick: (article) => handleTogglePublish(article.id, article.status),
      disabled: (article) => article.status === 'published',
    },
    {
      label: 'Salva come bozza',
      icon: EyeOff,
      onClick: (article) => handleTogglePublish(article.id, article.status),
      disabled: (article) => article.status === 'draft',
    },
    {
      label: 'Elimina',
      icon: Trash2,
      onClick: (article) => handleDelete(article.id),
      variant: 'destructive',
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestione Articoli</h2>
          <p className="text-muted-foreground">
            {initialTotal} {initialTotal === 1 ? 'articolo' : 'articoli'} in totale
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Articolo
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel
        fields={filterFields}
        filters={filters}
        onFilterChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cerca per titolo o contenuto..."
        title="Filtra articoli"
        description="Filtra articoli per stato, autore, data e altro"
        showSearch={true}
      />

      {/* Table */}
      <DataTable<Article>
        data={initialArticles}
        columns={columns}
        rowActions={rowActions}
        pagination={{
          page,
          pageSize,
          total: initialTotal,
          onPageChange: setPage,
        }}
        emptyMessage="Nessun articolo trovato"
        getRowKey={(article) => article.id}
      />

      {/* Create Dialog */}
      <ArticleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          router.refresh();
        }}
      />

      {/* Edit Dialog */}
      {editingArticle && (
        <ArticleFormDialog
          open={!!editingArticle}
          onOpenChange={(open) => {
            if (!open) setEditingArticle(null);
          }}
          article={editingArticle}
          onSuccess={() => {
            setEditingArticle(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
```

**Checkpoint 2.1:**
- [ ] File created
- [ ] All imports correct
- [ ] TypeScript compiles
- [ ] No eslint errors

---

### STEP 2.2: Test ArticlesClient (temporaneo)

**File:** `app/(admin)/admin/articles/page.tsx`
**Azione:** Temporary update for testing
**Tempo:** 15 minuti

**Replace content temporaneamente:**

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticlesFiltered } from '@/app/actions/articles';
import { ArticlesClient } from './articles-client';

export const metadata = {
  title: 'Gestione Articoli - Admin',
  description: 'Visualizza e gestisci tutti gli articoli',
};

export default async function ArticlesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch articles
  const { articles, total } = await getArticlesFiltered({
    limit: 20,
    offset: 0,
  });

  // Fetch authors for filter
  const { data: authors } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'admin')
    .order('name');

  return (
    <div className="container py-8">
      <ArticlesClient
        articles={articles}
        total={total}
        authors={authors || []}
      />
    </div>
  );
}
```

**Checkpoint 2.2:**
- [ ] Page loads without ArticleFormDialog (commented out)
- [ ] DataTable displays correctly
- [ ] Filters render
- [ ] No console errors

---

## PHASE 3: ARTICLE FORM DIALOG (180 minuti)

### STEP 3.1: Create article-form-dialog.tsx (parte 1 - Setup)

**File:** `app/(admin)/admin/articles/article-form-dialog.tsx` (NUOVO)
**Righe:** ~600 righe totali
**Tempo Part 1:** 60 minuti

**Prima parte del file (imports + types + setup):**

```typescript
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/organisms/editor/rich-text-editor';
import { ImageUpload } from '@/components/molecules/image-upload';
import { Loader2, Sparkles } from 'lucide-react';
import { createArticleSchema } from '@/lib/utils/validators';
import { createArticle, updateArticle } from '@/app/actions/articles';
import { uploadArticleImage } from '@/app/actions/storage';
import { generateSlug } from '@/lib/utils/slug-generator';
import type { z } from 'zod';

// ============================================
// TYPES
// ============================================

type ArticleFormValues = z.infer<typeof createArticleSchema>;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
}

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: Article;
  onSuccess?: () => void;
}

// ============================================
// AUTO-SAVE HOOK
// ============================================

function useFormAutoSave<T extends Record<string, any>>(
  values: T,
  key: string,
  delay = 30000
) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(values));
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [values, key, delay]);

  const clearAutoSave = React.useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  }, [key]);

  const restoreAutoSave = React.useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
      return null;
    }
  }, [key]);

  return { clearAutoSave, restoreAutoSave };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ArticleFormDialog({
  open,
  onOpenChange,
  article,
  onSuccess,
}: ArticleFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = React.useState(false);
  const isEditMode = !!article;

  // Form setup
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: article?.title || '',
      slug: article?.slug || '',
      excerpt: article?.excerpt || '',
      content: article?.content || '',
      coverImage: article?.cover_image || '',
      status: article?.status || 'draft',
    },
  });

  // Auto-save hook
  const autoSaveKey = isEditMode
    ? `article-edit-${article.id}`
    : 'article-create-draft';
  const { clearAutoSave, restoreAutoSave } = useFormAutoSave(
    form.watch(),
    autoSaveKey,
    30000
  );

  // Restore auto-saved data on mount (only for create mode)
  React.useEffect(() => {
    if (!isEditMode && open) {
      const savedData = restoreAutoSave();
      if (savedData && savedData.title) {
        const shouldRestore = confirm(
          'È stata trovata una bozza salvata automaticamente. Vuoi ripristinarla?'
        );
        if (shouldRestore) {
          form.reset(savedData);
          toast.info('Bozza ripristinata');
        } else {
          clearAutoSave();
        }
      }
    }
  }, [isEditMode, open, restoreAutoSave, clearAutoSave, form]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // Auto-generate slug from title
  const handleGenerateSlug = React.useCallback(async () => {
    const title = form.getValues('title');
    if (!title) {
      toast.error('Inserisci prima un titolo');
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const slug = generateSlug(title);
      form.setValue('slug', slug, { shouldValidate: true });
      toast.success('Slug generato');
    } catch (error) {
      toast.error('Errore nella generazione dello slug');
    } finally {
      setIsGeneratingSlug(false);
    }
  }, [form]);

  // Handle cover image upload
  const handleCoverImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { url, error } = await uploadArticleImage(formData);
    if (error) {
      toast.error(error);
      return null;
    }

    return url;
  };

  // Submit handler
  const onSubmit = async (values: ArticleFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('title', values.title);
      formData.set('slug', values.slug);
      formData.set('content', values.content);
      if (values.excerpt) formData.set('excerpt', values.excerpt);
      if (values.coverImage) formData.set('coverImage', values.coverImage);
      formData.set('status', values.status);

      let result;
      if (isEditMode) {
        result = await updateArticle(article.id, formData);
      } else {
        result = await createArticle(formData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isEditMode ? 'Articolo aggiornato' : 'Articolo creato'
        );
        clearAutoSave();
        onSuccess?.();
        form.reset();
      }
    } catch (error) {
      toast.error('Errore imprevisto');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Continue in STEP 3.2...
```

**Checkpoint 3.1:**
- [ ] File created with setup
- [ ] Imports correct
- [ ] Types defined
- [ ] useFormAutoSave hook implemented
- [ ] Form initialized
- [ ] TypeScript compiles

---

### STEP 3.2: Complete article-form-dialog.tsx (parte 2 - JSX)

**Continua nello stesso file:**

```typescript
  // ... continuazione da STEP 3.1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica i dettagli dell\'articolo'
              : 'Crea un nuovo articolo per la community'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Inserisci il titolo dell'articolo"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimo 5 caratteri, massimo 500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="slug-articolo"
                        {...field}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateSlug}
                        disabled={isGeneratingSlug || !form.watch('title')}
                      >
                        {isGeneratingSlug ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    URL-friendly version del titolo. Clicca l'icona per generarlo
                    automaticamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Excerpt */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estratto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrizione dell'articolo (opzionale)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Massimo 500 caratteri. Verrà mostrato nelle anteprime.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immagine di Copertina</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      onUpload={handleCoverImageUpload}
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5 * 1024 * 1024}
                    />
                  </FormControl>
                  <FormDescription>
                    Formati: JPEG, PNG, WebP. Massimo 5MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content - Rich Text Editor */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenuto *</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Scrivi il contenuto dell'articolo..."
                      minHeight="400px"
                    />
                  </FormControl>
                  <FormDescription>
                    Minimo 50 caratteri. Usa la toolbar per formattare il testo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="published">Pubblicato</SelectItem>
                      <SelectItem value="archived">Archiviato</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Gli articoli pubblicati saranno visibili pubblicamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-save indicator */}
            {!isEditMode && (
              <div className="text-xs text-muted-foreground">
                💾 Le modifiche vengono salvate automaticamente ogni 30 secondi
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Aggiorna' : 'Crea'} Articolo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**Checkpoint 3.2:**
- [ ] JSX structure complete
- [ ] All form fields present
- [ ] RichTextEditor integrated
- [ ] ImageUpload integrated
- [ ] Auto-save indicator visible
- [ ] Dialog renders correctly

---

### STEP 3.3: Create ImageUpload component (se manca)

**Verifica se esiste:** `components/molecules/image-upload.tsx`

**Se NON esiste, creare (100 righe):**

```typescript
'use client';

import * as React from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File troppo grande. Massimo ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        onChange(url);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-48 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Caricamento...' : 'Clicca per caricare'}
            </span>
          </div>
        </Button>
      )}
    </div>
  );
}
```

**Checkpoint 3.3:**
- [ ] ImageUpload component exists or created
- [ ] Imports correct
- [ ] TypeScript compiles

---

## PHASE 4: INTEGRATION & FINAL TOUCHES (60 minuti)

### STEP 4.1: Update page.tsx (final version)

**File:** `app/(admin)/admin/articles/page.tsx`
**Azione:** Replace with final version
**Tempo:** 30 minuti

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticlesFiltered } from '@/app/actions/articles';
import { ArticlesClient } from './articles-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Gestione Articoli - Admin',
  description: 'Visualizza e gestisci tutti gli articoli della piattaforma',
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    author_id?: string;
    created_from?: string;
    created_to?: string;
    published_from?: string;
    published_to?: string;
    has_cover_image?: string;
    search?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  const params = await searchParams;

  // Build filters from URL params
  const filters = {
    offset: parseInt(params.page || '0') * 20,
    limit: 20,
    status: params.status as 'draft' | 'published' | 'archived' | 'all' | undefined,
    authorId: params.author_id,
    createdFrom: params.created_from,
    createdTo: params.created_to,
    publishedFrom: params.published_from,
    publishedTo: params.published_to,
    hasCoverImage: params.has_cover_image === 'true' ? true : undefined,
    search: params.search,
  };

  // Fetch articles
  const { articles, total } = await getArticlesFiltered(filters);

  // Fetch authors for filter dropdown
  const { data: authors } = await supabase
    .from('users')
    .select('id, name')
    .in('role', ['admin', 'super_admin'])
    .order('name');

  return (
    <AdminPageLayout
      title="Gestione Articoli"
      description={`${total} articoli in totale`}
      backLink={{ href: '/admin', label: 'Dashboard' }}
    >
      <ArticlesClient
        articles={articles}
        total={total}
        authors={authors || []}
      />
    </AdminPageLayout>
  );
}
```

**Checkpoint 4.1:**
- [ ] Page uses AdminPageLayout
- [ ] Filters from URL params
- [ ] Authors fetched correctly
- [ ] TypeScript compiles

---

### STEP 4.2: Test rimozione file test-editor-client.tsx

**File da rimuovere:** `app/(admin)/admin/articles/test-editor-client.tsx`

```bash
rm app/(admin)/admin/articles/test-editor-client.tsx
```

**Checkpoint 4.2:**
- [ ] Test file removed
- [ ] Page still compiles

---

## PHASE 5: TESTING & VALIDATION (60 minuti)

### STEP 5.1: Manual Testing Checklist

**Test Scenario 1: Create Article (20 min)**
- [ ] Navigate to /admin/articles
- [ ] Click "Nuovo Articolo" button
- [ ] Dialog opens
- [ ] Fill title → auto-save triggers after 30s
- [ ] Click "Generate Slug" button → slug appears
- [ ] Fill excerpt (optional)
- [ ] Upload cover image → preview shows
- [ ] Write content in RichTextEditor
  - [ ] Bold text works
  - [ ] Italic works
  - [ ] Headings work
  - [ ] Image upload in editor works
  - [ ] Links work
- [ ] Select status: Draft
- [ ] Click "Crea Articolo"
- [ ] Toast success appears
- [ ] Article appears in table

**Test Scenario 2: Edit Article (15 min)**
- [ ] Click "Modifica" on existing article
- [ ] Dialog opens with pre-filled data
- [ ] Title shows correctly
- [ ] Slug shows correctly
- [ ] Content shows correctly in editor
- [ ] Cover image shows
- [ ] Modify title
- [ ] Click "Aggiorna Articolo"
- [ ] Toast success
- [ ] Changes reflected in table

**Test Scenario 3: Filters (10 min)**
- [ ] Open filter panel
- [ ] Filter by status: Published
- [ ] Results update
- [ ] Filter by author
- [ ] Results update
- [ ] Search by title
- [ ] Results update
- [ ] Clear all filters
- [ ] All articles show

**Test Scenario 4: Row Actions (10 min)**
- [ ] Click "Pubblica" on draft article
- [ ] Status changes to Published
- [ ] Click "Salva come bozza" on published
- [ ] Status changes to Draft
- [ ] Click "Elimina"
- [ ] Confirmation appears
- [ ] Confirm → article removed

**Test Scenario 5: Pagination (5 min)**
- [ ] Create 25+ articles (if needed)
- [ ] Navigate to page 2
- [ ] Next set of articles loads
- [ ] Go back to page 1

---

### STEP 5.2: TypeScript Validation

```bash
pnpm type-check
```

**Checkpoint 5.2:**
- [ ] No TypeScript errors in new files
- [ ] No TypeScript errors in modified files

---

### STEP 5.3: Build Test

```bash
pnpm build
```

**Checkpoint 5.3:**
- [ ] Build succeeds
- [ ] No build warnings related to articles

---

## PHASE 6: DOCUMENTATION (15 minuti)

### STEP 6.1: Update ROADMAP with completion

**File:** `ADMIN_PANEL_ROADMAP_6_8_WEEKS.md`

Mark Week 1 Day 3-4 as COMPLETED ✅

---

## FILES SUMMARY

### Created (7 files)

| File | Righe | Status |
|------|-------|--------|
| `lib/utils/slug-generator.ts` | 164 | ✅ COMPLETATO |
| `app/actions/articles.ts` (modified) | +120 | 🔨 TO DO |
| `app/(admin)/admin/articles/articles-client.tsx` | 450 | 🔨 TO DO |
| `app/(admin)/admin/articles/article-form-dialog.tsx` | 600 | 🔨 TO DO |
| `components/molecules/image-upload.tsx` | 100 | 🔨 TO DO |
| `app/(admin)/admin/articles/page.tsx` (final) | 80 | 🔨 TO DO |

### Modified (2 files)

| File | Changes | Status |
|------|---------|--------|
| `app/actions/articles.ts` | Add getArticlesFiltered() | 🔨 TO DO |
| `app/actions/articles.ts` | Update create/update with slug-generator | 🔨 TO DO |

### Removed (1 file)

| File | Reason |
|------|--------|
| `test-editor-client.tsx` | Test file, no longer needed |

---

## TIME ESTIMATES

| Phase | Task | Time |
|-------|------|------|
| **Phase 1** | Server Action | 60 min |
| → Step 1.1 | getArticlesFiltered() | 30 min |
| → Step 1.2 | Update createArticle() | 15 min |
| → Step 1.3 | Update updateArticle() | 15 min |
| **Phase 2** | ArticlesClient | 120 min |
| → Step 2.1 | Create component | 90 min |
| → Step 2.2 | Test integration | 30 min |
| **Phase 3** | ArticleFormDialog | 180 min |
| → Step 3.1 | Setup + logic | 60 min |
| → Step 3.2 | JSX + forms | 60 min |
| → Step 3.3 | ImageUpload (if needed) | 60 min |
| **Phase 4** | Integration | 60 min |
| → Step 4.1 | Final page.tsx | 30 min |
| → Step 4.2 | Cleanup | 30 min |
| **Phase 5** | Testing | 60 min |
| → Step 5.1 | Manual testing | 45 min |
| → Step 5.2-5.3 | TypeScript + Build | 15 min |
| **Phase 6** | Documentation | 15 min |
| **TOTAL** | | **495 min (8.25 ore)** |

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| TypeScript errors in DataTable integration | MEDIUM | HIGH | Follow exact interface from analysis |
| RichTextEditor rendering issues | LOW | MEDIUM | Already tested in Day 1-2 |
| ImageUpload component missing | MEDIUM | LOW | Create if needed (60 min) |
| FormDialog auto-save conflicts | LOW | LOW | Test thoroughly, localStorage namespaced |
| Slug uniqueness check slow | LOW | MEDIUM | Use indexed query, tenant isolation |

---

## SUCCESS CRITERIA

### Functional
- [x] ✅ Server action getArticlesFiltered() works
- [x] ✅ Slug generator integrates correctly
- [ ] ArticlesClient displays table with correct columns
- [ ] Filters work (status, author, date, search)
- [ ] Pagination works
- [ ] Create article dialog opens and submits
- [ ] Edit article dialog pre-fills correctly
- [ ] Auto-save works (30 sec delay)
- [ ] Image upload works (cover + inline)
- [ ] RichTextEditor formats content
- [ ] Delete article works with confirmation
- [ ] Publish/Unpublish toggle works

### Technical
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No console errors
- [ ] No memory leaks (test with 50+ articles)
- [ ] Mobile responsive (test on 375px width)

### UX
- [ ] Toast notifications on all actions
- [ ] Loading states during async operations
- [ ] Confirmation dialogs for destructive actions
- [ ] Empty states with helpful messages
- [ ] Form validation errors are clear

---

## NEXT STEPS AFTER COMPLETION

1. **Public Article Views** (Day 5-6)
   - `/articles` listing page
   - `/articles/[slug]` detail page
   - SEO metadata
   - Open Graph tags

2. **Polish & Optimization** (Day 7-8)
   - Add excerpt auto-generation
   - Add category support
   - Add tags/keywords
   - Mobile optimization testing
   - Accessibility audit

3. **Advanced Features** (Week 2+)
   - Article scheduling
   - Draft preview mode
   - Version history
   - Bulk operations
   - Analytics integration

---

**PLAN STATUS:** READY FOR EXECUTION 🚀
**NEXT ACTION:** Execute Phase 1 - Server Action (60 min)
