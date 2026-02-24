'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// CONSTANTS
// ============================================

const BUCKET_NAME = 'article-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

// ============================================
// UPLOAD ARTICLE IMAGE
// ============================================

/**
 * Uploads an image to Supabase Storage for articles
 * Validates file size and mime type before upload
 * Returns signed URL with 1-year validity
 *
 * @param formData - FormData containing 'file' field
 * @returns { url: string } or { error: string }
 */
export async function uploadArticleImage(formData: FormData) {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // 2. Check if user is admin or super_admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { error: 'Errore durante il recupero del profilo utente' };
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Non autorizzato: solo gli amministratori possono caricare immagini' };
    }

    // 3. Extract file from FormData
    const file = formData.get('file') as File;

    if (!file) {
      return { error: 'Nessun file fornito' };
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        error: `File troppo grande: massimo ${MAX_FILE_SIZE / 1024 / 1024}MB consentiti`,
      };
    }

    // 5. Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        error: `Tipo di file non valido: solo JPEG, PNG, WebP e SVG sono consentiti`,
      };
    }

    // 6. Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 7. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: `Errore durante il caricamento: ${uploadError.message}` };
    }

    // 8. Get public URL (or signed URL for private buckets)
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // 9. Return URL
    return { url: publicUrl };
  } catch (error) {
    console.error('Unexpected error in uploadArticleImage:', error);
    return { error: 'Errore imprevisto durante il caricamento dell\'immagine' };
  }
}

// ============================================
// DELETE ARTICLE IMAGE
// ============================================

/**
 * Deletes an image from Supabase Storage
 * Extracts filename from URL and deletes from bucket
 *
 * @param imageUrl - Full URL of the image to delete
 * @returns { success: boolean } or { error: string }
 */
export async function deleteArticleImage(imageUrl: string) {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // 2. Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { error: 'Errore durante il recupero del profilo utente' };
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Non autorizzato' };
    }

    // 3. Extract filename from URL
    // URL format: https://...supabase.co/storage/v1/object/public/article-images/filename.jpg
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length !== 2) {
      return { error: 'URL immagine non valido' };
    }

    const filePath = urlParts[1];

    // 4. Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { error: `Errore durante l'eliminazione: ${deleteError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteArticleImage:', error);
    return { error: 'Errore imprevisto durante l\'eliminazione dell\'immagine' };
  }
}

// ============================================
// LIST ARTICLE IMAGES (for media library feature - future)
// ============================================

/**
 * Lists all images in the article-images bucket
 * Admin only
 *
 * @returns { files: FileObject[] } or { error: string }
 */
export async function listArticleImages() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Non autorizzato' };
    }

    // List files
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list();

    if (error) {
      return { error: `Errore durante il recupero delle immagini: ${error.message}` };
    }

    return { files: data };
  } catch (error) {
    console.error('Unexpected error in listArticleImages:', error);
    return { error: 'Errore imprevisto' };
  }
}

// ============================================
// PROPOSAL ATTACHMENTS
// ============================================

const PROPOSAL_BUCKET = 'proposal-attachments';
const PROPOSAL_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const PROPOSAL_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

/**
 * Upload attachment for proposal
 * Verified residents only
 * Supports images and PDF
 *
 * @param formData - FormData with 'file' field
 * @param proposalId - UUID of the proposal
 * @returns { attachmentId, url } or { error }
 */
export async function uploadProposalAttachment(formData: FormData, proposalId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check verified resident
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.verification_status !== 'approved') {
      return { error: 'Solo residenti verificati possono caricare allegati' };
    }

    // Extract file
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'Nessun file fornito' };
    }

    // Validate size
    if (file.size > PROPOSAL_MAX_SIZE) {
      return { error: `File troppo grande: massimo ${PROPOSAL_MAX_SIZE / 1024 / 1024}MB` };
    }

    // Validate mime type
    if (!PROPOSAL_MIME_TYPES.includes(file.type)) {
      return { error: 'Tipo file non valido: solo immagini (JPEG, PNG, GIF, WebP) e PDF' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${proposalId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(PROPOSAL_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: `Errore durante il caricamento: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROPOSAL_BUCKET)
      .getPublicUrl(fileName);

    // Save to database
    const { data: attachment, error: dbError } = await (supabase.from as any)('proposal_attachments')
      .insert({
        proposal_id: proposalId,
        user_id: user.id,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
      })
      .select('id')
      .single();

    if (dbError || !attachment) {
      // Rollback storage upload
      await supabase.storage.from(PROPOSAL_BUCKET).remove([fileName]);
      return { error: 'Errore durante il salvataggio dei dati allegato' };
    }

    return {
      attachmentId: attachment.id,
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
    };
  } catch (error) {
    console.error('Unexpected error in uploadProposalAttachment:', error);
    return { error: 'Errore imprevisto durante il caricamento' };
  }
}

/**
 * Get attachments for a proposal
 */
export async function getProposalAttachments(proposalId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase.from as any)('proposal_attachments')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    if (error) {
      return { attachments: [] };
    }

    // Generate public URLs
    const attachmentsWithUrls = data.map((att: any) => {
      const { data: { publicUrl } } = supabase.storage
        .from(PROPOSAL_BUCKET)
        .getPublicUrl(att.file_path);

      return {
        ...att,
        url: publicUrl,
      };
    });

    return { attachments: attachmentsWithUrls };
  } catch (error) {
    console.error('Error in getProposalAttachments:', error);
    return { attachments: [] };
  }
}

/**
 * Delete proposal attachment
 * Owner or admin only
 */
// ============================================
// MARKETPLACE / MERCATINO IMAGES
// ============================================

const MARKETPLACE_BUCKET = 'marketplace-images';
const MARKETPLACE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MARKETPLACE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Upload image for marketplace/mercatino item
 * Verified residents only
 *
 * @param formData - FormData with 'file' field
 * @returns { url: string } or { error: string }
 */
export async function uploadMarketplaceImage(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check verified resident
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.verification_status !== 'approved') {
      return { error: 'Solo residenti verificati possono caricare immagini' };
    }

    // Extract file
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'Nessun file fornito' };
    }

    // Validate size
    if (file.size > MARKETPLACE_MAX_SIZE) {
      return { error: `File troppo grande: massimo ${MARKETPLACE_MAX_SIZE / 1024 / 1024}MB` };
    }

    // Validate mime type
    if (!MARKETPLACE_MIME_TYPES.includes(file.type)) {
      return { error: 'Tipo file non valido: solo JPEG, PNG e WebP' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(MARKETPLACE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Marketplace] Upload error:', uploadError);
      return { error: `Errore durante il caricamento: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(MARKETPLACE_BUCKET)
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error) {
    console.error('[Marketplace] Unexpected error in uploadMarketplaceImage:', error);
    return { error: 'Errore imprevisto durante il caricamento' };
  }
}

/**
 * Delete marketplace image
 * Owner only (verified by checking if URL contains user id folder)
 */
export async function deleteMarketplaceImage(imageUrl: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Extract path from URL
    const urlParts = imageUrl.split(`/${MARKETPLACE_BUCKET}/`);
    if (urlParts.length !== 2) {
      return { error: 'URL immagine non valido' };
    }

    const filePath = urlParts[1];

    // Verify ownership (path starts with user id)
    if (!filePath.startsWith(user.id)) {
      // Check if admin
      const { data: profile } = await supabase
        .from('users')
        .select('admin_role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.admin_role && ['admin', 'super_admin', 'moderator'].includes(profile.admin_role);
      if (!isAdmin) {
        return { error: 'Non autorizzato' };
      }
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(MARKETPLACE_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.error('[Marketplace] Delete error:', deleteError);
      return { error: `Errore durante l'eliminazione: ${deleteError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[Marketplace] Unexpected error in deleteMarketplaceImage:', error);
    return { error: 'Errore imprevisto' };
  }
}

export async function deleteProposalAttachment(attachmentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Get attachment info
    const { data: attachment, error: fetchError } = await (supabase.from as any)('proposal_attachments')
      .select('file_path, user_id')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return { error: 'Allegato non trovato' };
    }

    // Check permission (owner or admin)
    const { data: profile } = await supabase
      .from('users')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.admin_role && ['admin', 'super_admin', 'moderator'].includes(profile.admin_role);
    const isOwner = attachment.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return { error: 'Non autorizzato' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(PROPOSAL_BUCKET)
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue anyway - DB deletion is more important
    }

    // Delete from database
    const { error: dbError } = await (supabase.from as any)('proposal_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      return { error: 'Errore durante l\'eliminazione' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteProposalAttachment:', error);
    return { error: 'Errore imprevisto' };
  }
}
