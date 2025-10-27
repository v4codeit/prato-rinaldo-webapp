'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createThreadSchema, createPostSchema } from '@/lib/utils/validators';
import { nanoid } from 'nanoid';

/**
 * Get all forum categories
 */
export async function getForumCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return { categories: [] };
  }

  return { categories: data };
}

/**
 * Get category by ID
 */
export async function getCategoryById(categoryId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('id', categoryId)
    .single() as {
      data: {
        id: string;
        name: string;
        description: string;
        slug: string;
        is_private: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      } | null;
      error: any;
    };

  if (error) {
    return { category: null };
  }

  return { category: data };
}

/**
 * Get threads by category with pagination
 */
export async function getThreadsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get category details
  const { data: category } = await supabase
    .from('forum_categories')
    .select('is_private')
    .eq('id', categoryId)
    .single() as { data: { is_private: boolean } | null };

  // Check if category is private and user is verified
  if (category?.is_private) {
    if (!user) {
      return { threads: [], total: 0 };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    if (!profile || profile.verification_status !== 'approved') {
      return { threads: [], total: 0 };
    }
  }

  const offset = (page - 1) * limit;

  // Get threads with author info
  const { data, error, count } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      )
    `, { count: 'exact' })
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { threads: [], total: 0 };
  }

  return { threads: data, total: count || 0 };
}

/**
 * Get thread by ID with posts
 */
export async function getThreadById(threadId: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get thread details
  const { data: thread, error: threadError } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      ),
      category:forum_categories (
        id,
        name,
        is_private
      )
    `)
    .eq('id', threadId)
    .single() as {
      data: {
        id: string;
        category_id: string;
        author_id: string;
        tenant_id: string;
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
        views_count: number;
        last_activity_at: string;
        created_at: string;
        updated_at: string;
        author: {
          id: string;
          name: string;
          avatar: string;
          bio: string;
        };
        category: {
          id: string;
          name: string;
          is_private: boolean;
        };
      } | null;
      error: any;
    };

  if (threadError || !thread) {
    return { thread: null, posts: [], total: 0 };
  }

  // Check if category is private and user is verified
  if (thread.category?.is_private) {
    if (!user) {
      return { thread: null, posts: [], total: 0 };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    if (!profile || profile.verification_status !== 'approved') {
      return { thread: null, posts: [], total: 0 };
    }
  }

  const offset = (page - 1) * limit;

  // Get posts with author info
  const { data: posts, error: postsError, count } = await supabase
    .from('forum_posts')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      )
    `, { count: 'exact' })
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (postsError) {
    return { thread, posts: [], total: 0 };
  }

  return { thread, posts: posts || [], total: count || 0 };
}

/**
 * Create new thread (verified users only)
 */
export async function createThread(categoryId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono creare discussioni' };
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
  };

  const parsed = createThreadSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const threadId = nanoid();

  const { error } = await supabase.from('forum_threads').insert({
    id: threadId,
    category_id: categoryId,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    title: parsed.data.title,
    content: parsed.data.content,
    is_pinned: false,
    is_locked: false,
    views_count: 0,
    last_activity_at: new Date().toISOString(),
  });

  if (error) {
    return { error: 'Errore durante la creazione della discussione' };
  }

  revalidatePath(`/forum/${categoryId}`);
  return { success: true, threadId };
}

/**
 * Create new post in thread (verified users only)
 */
export async function createPost(threadId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono rispondere' };
  }

  // Check if thread is locked
  const { data: thread } = await supabase
    .from('forum_threads')
    .select('is_locked, category_id')
    .eq('id', threadId)
    .single() as { data: { is_locked: boolean; category_id: string } | null };

  if (thread?.is_locked) {
    return { error: 'Questa discussione è chiusa' };
  }

  const rawData = {
    content: formData.get('content') as string,
  };

  const parsed = createPostSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const postId = nanoid();

  const { error } = await supabase.from('forum_posts').insert({
    id: postId,
    thread_id: threadId,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    content: parsed.data.content,
  });

  if (error) {
    return { error: 'Errore durante la creazione del post' };
  }

  // Update thread last_activity_at
  await supabase
    .from('forum_threads')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', threadId);

  revalidatePath(`/forum/thread/${threadId}`);
  if (thread?.category_id) {
    revalidatePath(`/forum/${thread.category_id}`);
  }
  return { success: true, postId };
}

/**
 * Update post (owner or admin only)
 */
export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Get post and check ownership
  const { data: post } = await supabase
    .from('forum_posts')
    .select('author_id, thread_id')
    .eq('id', postId)
    .single() as { data: { author_id: string; thread_id: string } | null };

  if (!post) {
    return { error: 'Post non trovato' };
  }

  // Check if user is owner or admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  const isOwner = post.author_id === user.id;
  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

  if (!isOwner && !isAdmin) {
    return { error: 'Non autorizzato' };
  }

  const rawData = {
    content: formData.get('content') as string,
  };

  const parsed = createPostSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('forum_posts')
    .update({ content: parsed.data.content })
    .eq('id', postId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del post' };
  }

  revalidatePath(`/forum/thread/${post.thread_id}`);
  return { success: true };
}

/**
 * Delete post (owner or admin only)
 */
export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Get post and check ownership
  const { data: post } = await supabase
    .from('forum_posts')
    .select('author_id, thread_id')
    .eq('id', postId)
    .single() as { data: { author_id: string; thread_id: string } | null };

  if (!post) {
    return { error: 'Post non trovato' };
  }

  // Check if user is owner or admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  const isOwner = post.author_id === user.id;
  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

  if (!isOwner && !isAdmin) {
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione del post' };
  }

  revalidatePath(`/forum/thread/${post.thread_id}`);
  return { success: true };
}

/**
 * Increment thread views
 */
export async function incrementThreadViews(threadId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_thread_views', {
    thread_id: threadId,
  });

  if (error) {
    console.error('Error incrementing views:', error);
  }

  return { success: !error };
}

/**
 * Pin/unpin thread (admin only)
 */
export async function toggleThreadPin(threadId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Solo gli amministratori possono gestire i pin' };
  }

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('is_pinned, category_id')
    .eq('id', threadId)
    .single() as { data: { is_pinned: boolean; category_id: string } | null };

  if (!thread) {
    return { error: 'Discussione non trovata' };
  }

  const { error } = await supabase
    .from('forum_threads')
    .update({ is_pinned: !thread.is_pinned })
    .eq('id', threadId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento' };
  }

  revalidatePath(`/forum/${thread.category_id}`);
  revalidatePath(`/forum/thread/${threadId}`);
  return { success: true };
}

/**
 * Lock/unlock thread (admin only)
 */
export async function toggleThreadLock(threadId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Solo gli amministratori possono bloccare le discussioni' };
  }

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('is_locked, category_id')
    .eq('id', threadId)
    .single() as { data: { is_locked: boolean; category_id: string } | null };

  if (!thread) {
    return { error: 'Discussione non trovata' };
  }

  const { error } = await supabase
    .from('forum_threads')
    .update({ is_locked: !thread.is_locked })
    .eq('id', threadId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento' };
  }

  revalidatePath(`/forum/${thread.category_id}`);
  revalidatePath(`/forum/thread/${threadId}`);
  return { success: true };
}
