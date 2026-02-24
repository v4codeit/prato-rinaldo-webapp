'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/utils/validators';

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, bio, avatar, phone, role, admin_role, committee_role, membership_type, verification_status, tenant_id, created_at, updated_at')
    .eq('id', user.id)
    .single() as {
      data: {
        id: string;
        name: string;
        email: string;
        bio: string;
        avatar: string;
        phone: string | null;
        role: string;
        admin_role: string | null;
        committee_role: string | null;
        membership_type: string | null;
        verification_status: string;
        tenant_id: string;
        created_at: string;
        updated_at: string;
      } | null;
      error: any;
    };

  return { user: profile };
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const rawData = {
    name: formData.get('name') as string,
    bio: formData.get('bio') as string,
    phone: formData.get('phone') as string,
    avatar: formData.get('avatar') as string,
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('users')
    .update(parsed.data)
    .eq('id', user.id);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del profilo' };
  }

  revalidatePath('/profile');
  revalidatePath('/bacheca');
  return { success: true };
}

/**
 * Get user activities (placeholder - requires SQL function)
 */
export async function getUserActivities(userId: string) {
  const supabase = await createClient();

  // TODO: Implement SQL function for activities
  // For now, return empty array
  return { activities: [] };
}

/**
 * Get user badges
 * @param userId - User ID or 'current' for authenticated user
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient();

  // Handle 'current' user
  let targetUserId = userId;
  if (userId === 'current') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { badges: [] };
    }
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges!badge_id (
        id,
        name,
        description,
        icon,
        points
      )
    `)
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false });

  if (error) {
    return { badges: [] };
  }

  return { badges: data };
}

/**
 * Get user points total
 * @param userId - User ID or 'current' for authenticated user
 */
export async function getUserPoints(userId: string) {
  const supabase = await createClient();

  // Handle 'current' user
  let targetUserId = userId;
  if (userId === 'current') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { totalPoints: 0, level: 1 };
    }
    targetUserId = user.id;
  }

  // Get all user badges and sum points
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      badge:badges!badge_id (points)
    `)
    .eq('user_id', targetUserId);

  if (!userBadges) {
    return { totalPoints: 0, level: 1 };
  }

  const totalPoints = userBadges.reduce((sum, ub: any) => {
    return sum + (ub.badge?.points || 0);
  }, 0);

  // Calculate level (100 points per level)
  const level = Math.floor(totalPoints / 100) + 1;

  return { totalPoints, level };
}

/**
 * Admin: Get pending users (verification_status = 'pending')
 * Used for "Da verificare" section in admin users page
 */
export async function getPendingUsers(): Promise<{
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    phone: string | null;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { users: [], error: 'Non autenticato' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { users: [], error: 'Accesso negato' };
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar,
        phone,
        created_at
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return { users: [], error: 'Errore durante il caricamento' };
    }

    return { users: data || [] };
  } catch (error) {
    return { users: [], error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Get all users with pagination and filtering
 */
export async function getAllUsers(page: number = 1, limit: number = 50, filters?: {
  role?: string;
  verification_status?: string;
  search?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { users: [], total: 0, error: 'Non autenticato' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { users: [], total: 0, error: 'Accesso negato' };
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar,
        phone,
        role,
        admin_role,
        committee_role,
        is_in_board,
        is_in_council,
        verification_status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role as never);
    }
    if (filters?.verification_status && filters.verification_status !== 'all') {
      query = query.eq('verification_status', filters.verification_status as never);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return { users: [], total: 0, error: 'Errore durante il caricamento' };
    }

    return { users: data, total: count || 0 };
  } catch (error) {
    return { users: [], total: 0, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Update user role
 */
export async function updateUserRole(userId: string, role: string, adminRole?: string | null) {
  try {
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
      return { error: 'Accesso negato' };
    }

    const updateData: any = { role };
    if (adminRole !== undefined) {
      updateData.admin_role = adminRole;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento' };
    }

    // Sync topic membership when role changes (may gain access to admin-only topics)
    try {
      const { syncUserTopicMembershipById } = await import('@/lib/topics/auto-membership');
      await syncUserTopicMembershipById(userId);
    } catch (syncError) {
      console.error('[updateUserRole] Error syncing topic membership:', syncError);
      // Don't fail the main operation if sync fails
    }

    revalidatePath('/admin/users');
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Update user verification status
 * - Sends email notification to the user
 * - Creates in-app notification for the user
 * - Auto-syncs topic membership when approved
 */
export async function updateVerificationStatus(userId: string, status: 'pending' | 'approved' | 'rejected') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single() as { data: { role: string; tenant_id: string } | null };

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return { error: 'Accesso negato' };
    }

    // Get target user info for notifications
    const { data: targetUser } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single() as { data: { name: string; email: string } | null };

    // Build update data - verification_status is the only activation mechanism for users
    const updateData: Record<string, unknown> = {
      verification_status: status,
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[updateVerificationStatus] Supabase error:', error);
      return { error: 'Errore durante l\'aggiornamento' };
    }

    // Auto-add user to applicable topics when approved
    if (status === 'approved') {
      try {
        const { syncUserTopicMembershipById } = await import('@/lib/topics/auto-membership');
        await syncUserTopicMembershipById(userId);
      } catch (syncError) {
        console.error('[updateVerificationStatus] Error syncing topic membership:', syncError);
        // Don't fail the main operation if sync fails
      }
    }

    // Send email notification to the user (non-blocking)
    if (targetUser?.email && (status === 'approved' || status === 'rejected')) {
      try {
        const { sendUserVerificationEmail } = await import('@/app/actions/email-notifications');
        sendUserVerificationEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || 'Utente',
          status: status,
        }).catch((emailError) => {
          console.error('[updateVerificationStatus] Error sending email:', emailError);
        });
      } catch (importError) {
        console.error('[updateVerificationStatus] Error importing email module:', importError);
      }
    }

    // Create in-app notification for the user
    if (status === 'approved' || status === 'rejected') {
      try {
        const notificationType = status === 'approved' ? 'user_approved' : 'user_rejected';
        const notificationTitle = status === 'approved'
          ? 'Account verificato!'
          : 'Verifica account non approvata';
        const notificationMessage = status === 'approved'
          ? 'Il tuo account è stato verificato. Ora puoi accedere a tutte le funzionalità della community.'
          : 'La tua richiesta di verifica non è stata approvata. Contattaci per maggiori informazioni.';

        await supabase.from('user_notifications').insert({
          tenant_id: adminProfile.tenant_id,
          user_id: userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          action_url: status === 'approved' ? '/bacheca' : null,
          status: 'unread',
          requires_action: false,
        });
      } catch (notificationError) {
        console.error('[updateVerificationStatus] Error creating notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    revalidatePath('/admin/users');
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Resend verification email to a user
 * Works for both approved and rejected users
 */
export async function resendVerificationEmail(userId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return { error: 'Accesso negato' };
    }

    // Get target user info
    const { data: targetUser } = await supabase
      .from('users')
      .select('name, email, verification_status')
      .eq('id', userId)
      .single() as { data: { name: string; email: string; verification_status: string } | null };

    if (!targetUser) {
      return { error: 'Utente non trovato' };
    }

    if (!targetUser.email) {
      return { error: 'L\'utente non ha un indirizzo email' };
    }

    try {
      const emailModule = await import('@/app/actions/email-notifications');
      let result: { success: boolean; error?: string };

      if (targetUser.verification_status === 'pending') {
        // Send welcome email for pending users
        result = await emailModule.sendWelcomeEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || 'Utente',
        });
      } else {
        // Send verification result email for approved/rejected users
        result = await emailModule.sendUserVerificationEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || 'Utente',
          status: targetUser.verification_status as 'approved' | 'rejected',
        });
      }

      if (!result.success) {
        console.error('[resendVerificationEmail] Email send failed:', result.error);
        return { error: `Errore invio email: ${result.error}` };
      }

      return { success: true };
    } catch (emailError) {
      console.error('[resendVerificationEmail] Error:', emailError);
      return { error: 'Errore durante l\'invio dell\'email' };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

/**
 * Admin: Hard delete user and all associated data
 * Uses admin client to delete from auth.users which cascades to:
 * - users table (ON DELETE CASCADE from auth.users)
 * - articles, announcements, events, marketplace_items, proposals, etc.
 * - conversations, messages, topic_members, topic_message_reactions
 * - user_badges, push_subscriptions, user_notifications
 * - proposal_votes, proposal_comments, proposal_attachments
 * Tables with ON DELETE SET NULL (preserved with null author):
 * - topic_messages, moderation_queue, site_settings, mercatino_views
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Non autenticato' };
    }

    // Check if user is super_admin (only super admin can delete)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || profile.role !== 'super_admin') {
      return { error: 'Solo i super admin possono eliminare utenti' };
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return { error: 'Non puoi eliminare il tuo account' };
    }

    console.log('[deleteUser] START - Deleting user:', userId);

    // Use admin client for storage cleanup and auth deletion
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = createAdminClient();

    // 1. Clean up storage: proposal attachments
    const { data: attachments } = await adminSupabase
      .from('proposal_attachments')
      .select('file_path')
      .eq('user_id', userId);

    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((a) => a.file_path);
      const { error: storageError } = await adminSupabase.storage
        .from('proposal-attachments')
        .remove(filePaths);
      if (storageError) {
        console.error('[deleteUser] Error cleaning proposal attachments storage:', storageError);
      } else {
        console.log(`[deleteUser] Removed ${filePaths.length} proposal attachment files`);
      }
    }

    // 2. Clean up storage: topic message images/audio authored by user
    const { data: topicMessages } = await adminSupabase
      .from('topic_messages')
      .select('id, message_type, metadata')
      .eq('author_id', userId)
      .in('message_type', ['image', 'voice']);

    if (topicMessages && topicMessages.length > 0) {
      const imagePaths: string[] = [];
      const audioPaths: string[] = [];

      for (const msg of topicMessages) {
        const meta = msg.metadata as Record<string, unknown> | null;
        if (meta && typeof meta === 'object' && 'path' in meta && typeof meta.path === 'string') {
          if (msg.message_type === 'image') {
            imagePaths.push(meta.path);
          } else if (msg.message_type === 'voice') {
            audioPaths.push(meta.path);
          }
        }
      }

      if (imagePaths.length > 0) {
        const { error: imgErr } = await adminSupabase.storage.from('topic-images').remove(imagePaths);
        if (imgErr) console.error('[deleteUser] Error cleaning topic images:', imgErr);
        else console.log(`[deleteUser] Removed ${imagePaths.length} topic image files`);
      }
      if (audioPaths.length > 0) {
        const { error: audErr } = await adminSupabase.storage.from('topic-audio').remove(audioPaths);
        if (audErr) console.error('[deleteUser] Error cleaning topic audio:', audErr);
        else console.log(`[deleteUser] Removed ${audioPaths.length} topic audio files`);
      }
    }

    // 3. Delete user from auth.users (cascades to all tables with ON DELETE CASCADE)
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('[deleteUser] SUPABASE AUTH DELETE ERROR:', {
        message: authDeleteError.message,
        status: authDeleteError.status,
      });
      return { error: `Errore durante l'eliminazione: ${authDeleteError.message}` };
    }

    console.log('[deleteUser] User deleted successfully:', userId);

    revalidatePath('/admin/users');
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('[deleteUser] Unexpected error:', error);
    return { error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}
