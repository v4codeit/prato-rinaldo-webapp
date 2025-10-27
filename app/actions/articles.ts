'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createArticleSchema } from '@/lib/utils/validators';
import { nanoid } from 'nanoid';

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
 * Create new article (admin only)
 */
export async function createArticle(formData: FormData) {
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

  const rawData = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    coverImage: formData.get('coverImage') as string,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
  };

  const parsed = createArticleSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const articleData = {
    id: nanoid(),
    ...parsed.data,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('articles').insert(articleData);

  if (error) {
    return { error: 'Errore durante la creazione dell\'articolo' };
  }

  revalidatePath('/');
  revalidatePath('/admin/articles');
  return { success: true };
}

/**
 * Update article (admin only)
 */
export async function updateArticle(articleId: string, formData: FormData) {
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

  const rawData = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    coverImage: formData.get('coverImage') as string,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
  };

  const parsed = createArticleSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const updateData = {
    ...parsed.data,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', articleId)
    .eq('tenant_id', profile.tenant_id);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dell\'articolo' };
  }

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
