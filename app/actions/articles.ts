'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createArticleSchema } from '@/lib/utils/validators';
import { generateUniqueSlug } from '@/lib/utils/slug-generator';

/**
 * Get all published articles
 */
export async function getPublishedArticles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    return { articles: [] };
  }

  return { articles: data };
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    return { article: null };
  }

  return { article: data };
}

/**
 * Get article by slug including drafts (admin preview only)
 */
export async function getArticleBySlugWithPreview(slug: string) {
  const requestId = crypto.randomUUID();
  console.log(`[getArticleBySlugWithPreview] ✓ CHECKPOINT 1 - Request started`, { requestId, slug });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error(`[getArticleBySlugWithPreview] ✗ CHECKPOINT 1 FAILED - No authenticated user`, { requestId, slug });
    return { article: null, error: 'Non autenticato' };
  }

  console.log(`[getArticleBySlugWithPreview] ✓ CHECKPOINT 1 - User authenticated`, { requestId, slug, userId: user.id });

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null; error: any };

  if (profileError) {
    console.error(`[getArticleBySlugWithPreview] ✗ CHECKPOINT 2 FAILED - Profile fetch error`, {
      requestId,
      slug,
      userId: user.id,
      error: profileError,
    });
    return { article: null, error: 'Errore nel recupero del profilo utente' };
  }

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    console.error(`[getArticleBySlugWithPreview] ✗ CHECKPOINT 2 FAILED - Unauthorized role`, {
      requestId,
      slug,
      userId: user.id,
      role: profile?.role,
    });
    return { article: null, error: 'Accesso negato' };
  }

  console.log(`[getArticleBySlugWithPreview] ✓ CHECKPOINT 2 - Admin role verified`, {
    requestId,
    slug,
    userId: user.id,
    role: profile.role,
  });

  // Fetch article (any status)
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (error) {
    console.error(`[getArticleBySlugWithPreview] ✗ CHECKPOINT 3 FAILED - Fetch error`, {
      requestId,
      slug,
      error,
    });
    return { article: null };
  }

  console.log(`[getArticleBySlugWithPreview] ✓ CHECKPOINT 3 - Article fetched`, {
    requestId,
    slug,
    articleId: data.id,
    status: data.status,
  });

  return { article: data };
}

/**
 * Create new article (admin only)
 */
export async function createArticle(formData: FormData) {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  console.log(`[createArticle] ✓ CHECKPOINT 1 - Request started`, { requestId });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error(`[createArticle] ✗ CHECKPOINT 1 FAILED - No authenticated user`, { requestId });
    return { error: 'Non autenticato' };
  }

  console.log(`[createArticle] ✓ CHECKPOINT 1 - User authenticated`, { requestId, userId: user.id });

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null; error: any };

  if (profileError) {
    console.error(`[createArticle] ✗ CHECKPOINT 2 FAILED - Profile fetch error`, {
      requestId,
      userId: user.id,
      error: profileError,
    });
    return { error: 'Errore nel recupero del profilo utente' };
  }

  console.log(`[createArticle] ✓ CHECKPOINT 2 - Profile fetched`, {
    requestId,
    userId: user.id,
    role: profile?.role,
    tenantId: profile?.tenant_id,
  });

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    console.error(`[createArticle] ✗ CHECKPOINT 3 FAILED - Unauthorized role`, {
      requestId,
      userId: user.id,
      role: profile?.role,
    });
    return { error: 'Accesso negato' };
  }

  console.log(`[createArticle] ✓ CHECKPOINT 3 - Admin role verified`, {
    requestId,
    userId: user.id,
    role: profile.role,
  });

  const rawData = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    coverImage: formData.get('coverImage') as string,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
  };

  console.log(`[createArticle] ✓ CHECKPOINT 4 - FormData extracted`, {
    requestId,
    rawData: {
      title: rawData.title,
      slug: rawData.slug,
      excerptLength: rawData.excerpt?.length || 0,
      contentLength: rawData.content?.length || 0,
      hasCoverImage: !!rawData.coverImage,
      status: rawData.status,
    },
  });

  const parsed = createArticleSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || 'Dati non validi';
    console.error(`[createArticle] ✗ CHECKPOINT 5 FAILED - Validation error`, {
      requestId,
      errors: parsed.error.flatten(),
      rawData,
    });
    return { error: errorMessage };
  }

  console.log(`[createArticle] ✓ CHECKPOINT 5 - Validation passed`, {
    requestId,
    validatedData: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      status: parsed.data.status,
      hasCoverImage: !!parsed.data.coverImage,
    },
  });

  // Generate unique slug from title
  const uniqueSlug = await generateUniqueSlug(parsed.data.title, profile.tenant_id);

  console.log(`[createArticle] ✓ CHECKPOINT 6 - Unique slug generated`, {
    requestId,
    originalSlug: parsed.data.slug,
    uniqueSlug,
  });

  // CRITICAL FIX: Explicit field mapping (coverImage → cover_image)
  const articleData = {
    title: parsed.data.title,
    content: parsed.data.content,
    excerpt: parsed.data.excerpt || null,
    cover_image: parsed.data.coverImage || null, // ✓ Explicit mapping to snake_case
    slug: uniqueSlug,
    status: parsed.data.status,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  };

  console.log(`[createArticle] ✓ CHECKPOINT 7 - Article data assembled`, {
    requestId,
    articleData: {
      ...articleData,
      content: `${articleData.content.substring(0, 100)}...`,
    },
  });

  const { error } = await supabase.from('articles').insert(articleData);

  if (error) {
    console.error(`[createArticle] ✗ CHECKPOINT 8 FAILED - Database insert error`, {
      requestId,
      userId: user.id,
      tenantId: profile.tenant_id,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      attemptedData: {
        ...articleData,
        content: `${articleData.content.substring(0, 100)}...`,
      },
    });

    // Error-specific messages
    if (error.code === '23505') {
      return { error: 'Esiste già un articolo con questo slug' };
    } else if (error.code === '23503') {
      return { error: 'Errore di riferimento al database (foreign key)' };
    } else if (error.code === '42501') {
      return { error: 'Permessi insufficienti per creare l\'articolo' };
    }

    return { error: 'Errore durante la creazione dell\'articolo' };
  }

  console.log(`[createArticle] ✓ CHECKPOINT 8 - Article inserted successfully`, {
    requestId,
    slug: uniqueSlug,
    status: articleData.status,
  });

  revalidatePath('/');
  revalidatePath('/admin/articles');
  return { success: true };
}

/**
 * Update article (admin only)
 */
export async function updateArticle(articleId: string, formData: FormData) {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  console.log(`[updateArticle] ✓ CHECKPOINT 1 - Request started`, { requestId, articleId });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error(`[updateArticle] ✗ CHECKPOINT 1 FAILED - No authenticated user`, { requestId, articleId });
    return { error: 'Non autenticato' };
  }

  console.log(`[updateArticle] ✓ CHECKPOINT 1 - User authenticated`, { requestId, articleId, userId: user.id });

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null; error: any };

  if (profileError) {
    console.error(`[updateArticle] ✗ CHECKPOINT 2 FAILED - Profile fetch error`, {
      requestId,
      articleId,
      userId: user.id,
      error: profileError,
    });
    return { error: 'Errore nel recupero del profilo utente' };
  }

  console.log(`[updateArticle] ✓ CHECKPOINT 2 - Profile fetched`, {
    requestId,
    articleId,
    userId: user.id,
    role: profile?.role,
    tenantId: profile?.tenant_id,
  });

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    console.error(`[updateArticle] ✗ CHECKPOINT 3 FAILED - Unauthorized role`, {
      requestId,
      articleId,
      userId: user.id,
      role: profile?.role,
    });
    return { error: 'Accesso negato' };
  }

  console.log(`[updateArticle] ✓ CHECKPOINT 3 - Admin role verified`, {
    requestId,
    articleId,
    userId: user.id,
    role: profile.role,
  });

  const rawData = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    coverImage: formData.get('coverImage') as string,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
  };

  console.log(`[updateArticle] ✓ CHECKPOINT 4 - FormData extracted`, {
    requestId,
    articleId,
    rawData: {
      title: rawData.title,
      slug: rawData.slug,
      excerptLength: rawData.excerpt?.length || 0,
      contentLength: rawData.content?.length || 0,
      hasCoverImage: !!rawData.coverImage,
      status: rawData.status,
    },
  });

  const parsed = createArticleSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || 'Dati non validi';
    console.error(`[updateArticle] ✗ CHECKPOINT 5 FAILED - Validation error`, {
      requestId,
      articleId,
      errors: parsed.error.flatten(),
      rawData,
    });
    return { error: errorMessage };
  }

  console.log(`[updateArticle] ✓ CHECKPOINT 5 - Validation passed`, {
    requestId,
    articleId,
    validatedData: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      status: parsed.data.status,
      hasCoverImage: !!parsed.data.coverImage,
    },
  });

  // Generate unique slug from title, excluding current article
  const uniqueSlug = await generateUniqueSlug(parsed.data.title, profile.tenant_id, articleId);

  console.log(`[updateArticle] ✓ CHECKPOINT 6 - Unique slug generated`, {
    requestId,
    articleId,
    originalSlug: parsed.data.slug,
    uniqueSlug,
  });

  // CRITICAL FIX: Explicit field mapping (coverImage → cover_image)
  const updateData = {
    title: parsed.data.title,
    content: parsed.data.content,
    excerpt: parsed.data.excerpt || null,
    cover_image: parsed.data.coverImage || null, // ✓ Explicit mapping to snake_case
    slug: uniqueSlug,
    status: parsed.data.status,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  };

  console.log(`[updateArticle] ✓ CHECKPOINT 7 - Update data assembled`, {
    requestId,
    articleId,
    updateData: {
      ...updateData,
      content: `${updateData.content.substring(0, 100)}...`,
    },
  });

  const { error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', articleId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    console.error(`[updateArticle] ✗ CHECKPOINT 8 FAILED - Database update error`, {
      requestId,
      articleId,
      userId: user.id,
      tenantId: profile.tenant_id,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      attemptedData: {
        ...updateData,
        content: `${updateData.content.substring(0, 100)}...`,
      },
    });

    // Error-specific messages
    if (error.code === '23505') {
      return { error: 'Esiste già un articolo con questo slug' };
    } else if (error.code === '23503') {
      return { error: 'Errore di riferimento al database (foreign key)' };
    } else if (error.code === '42501') {
      return { error: 'Permessi insufficienti per aggiornare l\'articolo' };
    }

    return { error: 'Errore durante l\'aggiornamento dell\'articolo' };
  }

  console.log(`[updateArticle] ✓ CHECKPOINT 8 - Article updated successfully`, {
    requestId,
    articleId,
    slug: uniqueSlug,
    status: updateData.status,
  });

  revalidatePath('/');
  revalidatePath('/admin/articles');
  return { success: true };
}

/**
 * Delete article (admin only)
 */
export async function deleteArticle(articleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Accesso negato' };
  }

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { error: 'Errore durante l\'eliminazione dell\'articolo' };
  }

  revalidatePath('/');
  revalidatePath('/admin/articles');
  return { success: true };
}

/**
 * Filter and paginate articles (admin only)
 */
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
  articles: any[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export async function getArticlesFiltered(
  filters: ArticlesFilterParams = {}
): Promise<ArticlesFilterResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      articles: [],
      total: 0,
      offset: 0,
      limit: 20,
      hasMore: false,
    };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { role: string; tenant_id: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return {
      articles: [],
      total: 0,
      offset: 0,
      limit: 20,
      hasMore: false,
    };
  }

  // Apply defaults
  const {
    offset = 0,
    limit = 20,
    search,
    status = 'all',
    authorId,
    createdFrom,
    createdTo,
    publishedFrom,
    publishedTo,
    hasCoverImage,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  // Limit max page size to 100
  const safeLimit = Math.min(limit, 100);

  // Build base query with tenant filter
  let query = supabase
    .from('articles')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      )
    `, { count: 'exact' })
    .eq('tenant_id', profile.tenant_id);

  // Apply filters
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  if (createdFrom) {
    query = query.gte('created_at', createdFrom);
  }

  if (createdTo) {
    query = query.lte('created_at', createdTo);
  }

  if (publishedFrom) {
    query = query.gte('published_at', publishedFrom);
  }

  if (publishedTo) {
    query = query.lte('published_at', publishedTo);
  }

  if (hasCoverImage !== undefined) {
    if (hasCoverImage) {
      query = query.not('cover_image', 'is', null);
    } else {
      query = query.is('cover_image', null);
    }
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + safeLimit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    return {
      articles: [],
      total: 0,
      offset: 0,
      limit: safeLimit,
      hasMore: false,
    };
  }

  const total = count || 0;
  const hasMore = offset + safeLimit < total;

  return {
    articles: data || [],
    total,
    offset,
    limit: safeLimit,
    hasMore,
  };
}
