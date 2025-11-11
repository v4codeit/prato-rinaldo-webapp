'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createDocumentSchema, createTutorialSchema } from '@/lib/utils/validators';

/**
 * Get all documents with filtering
 */
export async function getDocuments(category?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('documents')
    .select(`
      *,
      uploader:users!uploaded_by (
        id,
        name,
        avatar
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { documents: [] };
  }

  return { documents: data };
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:users!uploaded_by (
        id,
        name,
        avatar
      )
    `)
    .eq('id', documentId)
    .single() as {
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        file_url: string;
        file_type: string;
        file_size: number;
        is_public: boolean;
        uploaded_by: string;
        tenant_id: string;
        downloads_count: number;
        created_at: string;
        updated_at: string;
        uploader: {
          id: string;
          name: string;
          avatar: string;
        };
      } | null;
      error: any;
    };

  if (error) {
    return { document: null };
  }

  return { document: data };
}

/**
 * Create document (admin only)
 */
export async function createDocument(formData: FormData) {
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
    return { error: 'Solo gli amministratori possono caricare documenti' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    fileUrl: formData.get('fileUrl') as string,
    fileType: formData.get('fileType') as string,
    fileSize: parseInt(formData.get('fileSize') as string),
    isPublic: formData.get('isPublic') === 'true',
  };

  const parsed = createDocumentSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase.from('documents').insert({
    ...parsed.data,
    uploaded_by: user.id,
    tenant_id: profile.tenant_id,
    downloads_count: 0,
  });

  if (error) {
    return { error: 'Errore durante il caricamento del documento' };
  }

  revalidatePath('/resources/documents');
  return { success: true };
}

/**
 * Update document (admin only)
 */
export async function updateDocument(documentId: string, formData: FormData) {
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
    return { error: 'Non autorizzato' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    fileUrl: formData.get('fileUrl') as string,
    fileType: formData.get('fileType') as string,
    fileSize: parseInt(formData.get('fileSize') as string),
    isPublic: formData.get('isPublic') === 'true',
  };

  const parsed = createDocumentSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('documents')
    .update(parsed.data)
    .eq('id', documentId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del documento' };
  }

  revalidatePath('/resources/documents');
  return { success: true };
}

/**
 * Delete document (admin only)
 */
export async function deleteDocument(documentId: string) {
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
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione del documento' };
  }

  revalidatePath('/resources/documents');
  return { success: true };
}

/**
 * Increment document downloads count
 */
export async function incrementDocumentDownloads(documentId: string) {
  const supabase = await createClient();

  await supabase.rpc('increment_document_downloads', {
    document_id: documentId,
  });

  return { success: true };
}

/**
 * Get all tutorials
 */
export async function getTutorials(category?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('tutorials')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      )
    `)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { tutorials: [] };
  }

  return { tutorials: data };
}

/**
 * Get tutorial by ID
 */
export async function getTutorialById(tutorialId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tutorials')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('id', tutorialId)
    .single() as {
      data: {
        id: string;
        title: string;
        content: string;
        category: string;
        cover_image: string | null;
        video_url: string | null;
        difficulty: string;
        estimated_time: number;
        author_id: string;
        tenant_id: string;
        views_count: number;
        created_at: string;
        updated_at: string;
        author: {
          id: string;
          name: string;
          avatar: string;
          bio: string;
        };
      } | null;
      error: any;
    };

  if (error) {
    return { tutorial: null };
  }

  return { tutorial: data };
}

/**
 * Create tutorial (admin only)
 */
export async function createTutorial(formData: FormData) {
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
    return { error: 'Solo gli amministratori possono creare tutorial' };
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    category: formData.get('category') as string,
    coverImage: formData.get('coverImage') as string || undefined,
    videoUrl: formData.get('videoUrl') as string || undefined,
    difficulty: formData.get('difficulty') as string,
    estimatedTime: parseInt(formData.get('estimatedTime') as string),
  };

  const parsed = createTutorialSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase.from('tutorials').insert({
    ...parsed.data,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    views_count: 0,
  });

  if (error) {
    return { error: 'Errore durante la creazione del tutorial' };
  }

  revalidatePath('/resources/tutorials');
  return { success: true };
}

/**
 * Update tutorial (admin only)
 */
export async function updateTutorial(tutorialId: string, formData: FormData) {
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
    return { error: 'Non autorizzato' };
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    category: formData.get('category') as string,
    coverImage: formData.get('coverImage') as string || undefined,
    videoUrl: formData.get('videoUrl') as string || undefined,
    difficulty: formData.get('difficulty') as string,
    estimatedTime: parseInt(formData.get('estimatedTime') as string),
  };

  const parsed = createTutorialSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('tutorials')
    .update(parsed.data)
    .eq('id', tutorialId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del tutorial' };
  }

  revalidatePath('/resources/tutorials');
  return { success: true };
}

/**
 * Delete tutorial (admin only)
 */
export async function deleteTutorial(tutorialId: string) {
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
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('tutorials')
    .delete()
    .eq('id', tutorialId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione del tutorial' };
  }

  revalidatePath('/resources/tutorials');
  return { success: true };
}

/**
 * Increment tutorial views
 */
export async function incrementTutorialViews(tutorialId: string) {
  const supabase = await createClient();

  await supabase.rpc('increment_tutorial_views', {
    tutorial_id: tutorialId,
  });

  return { success: true };
}

/**
 * Create tutorial request (verified users)
 */
export async function createTutorialRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id, name')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string; name: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono richiedere tutorial' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (!title || title.length < 10) {
    return { error: 'Il titolo deve contenere almeno 10 caratteri' };
  }

  const { data: requestData, error } = (await supabase.from('tutorial_requests').insert({
    title,
    description,
    requested_by: user.id,
    tenant_id: profile.tenant_id,
    status: 'pending',
    votes_count: 0,
  }).select('id').single()) as { data: { id: string } | null; error: any };

  if (error || !requestData) {
    return { error: 'Errore durante la creazione della richiesta' };
  }

  const requestId = requestData.id;

  // Create moderation queue entry
  await supabase.from('moderation_queue').insert({
    item_type: 'tutorial_request',
    item_id: requestId,
    tenant_id: profile.tenant_id,
    item_creator_id: user.id,
    item_title: title,
    item_creator_name: profile.name || user.email || 'Unknown',
    status: 'pending',
  });

  revalidatePath('/resources/tutorials');
  return { success: true };
}

/**
 * Get tutorial requests
 */
export async function getTutorialRequests() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tutorial_requests')
    .select(`
      *,
      requester:users!requester_id (
        id,
        name,
        avatar
      )
    `)
    .eq('status', 'pending')
    .order('votes_count', { ascending: false })
    .limit(20);

  if (error) {
    return { requests: [] };
  }

  return { requests: data };
}
