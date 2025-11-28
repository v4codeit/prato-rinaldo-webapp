'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { UserNotification, NotificationType } from '@/types/notifications';

/**
 * Get notifications for current user
 * @param limit - Maximum number of notifications to fetch (default: 50)
 */
export async function getNotifications(limit: number = 50): Promise<{
  notifications: UserNotification[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], error: 'Non autenticato' };
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getNotifications] Error:', error);
    return { notifications: [], error: error.message };
  }

  return { notifications: (data as UserNotification[]) || [] };
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadNotificationCount(): Promise<{
  count: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0 };
  }

  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('[getUnreadNotificationCount] Error:', error);
    return { count: 0 };
  }

  return { count: data || 0 };
}

/**
 * Mark a single notification as read
 * @param notificationId - UUID of the notification
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });

  if (error) {
    console.error('[markNotificationAsRead] Error:', error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Mark notification action as completed
 * @param notificationId - UUID of the notification (optional if using relatedId)
 * @param relatedId - UUID of the related entity (optional, marks all related notifications)
 */
export async function markNotificationActionCompleted(
  notificationId?: string,
  relatedId?: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const { error } = await supabase.rpc('mark_notification_action_completed', {
    p_notification_id: notificationId || null,
    p_related_id: relatedId || null,
  });

  if (error) {
    console.error('[markNotificationActionCompleted] Error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const { error } = await supabase
    .from('user_notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'unread');

  if (error) {
    console.error('[markAllNotificationsAsRead] Error:', error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Create a notification (admin only)
 * Typically notifications are created via database triggers,
 * but this can be used for manual/testing purposes
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedType,
  relatedId,
  actionUrl,
  requiresAction = false,
  metadata = {},
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  requiresAction?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Accesso negato' };
  }

  const { error } = await supabase.from('user_notifications').insert({
    tenant_id: profile.tenant_id,
    user_id: userId,
    type,
    title,
    message,
    related_type: relatedType,
    related_id: relatedId,
    action_url: actionUrl,
    status: requiresAction ? 'action_pending' : 'unread',
    requires_action: requiresAction,
    metadata,
  });

  if (error) {
    console.error('[createNotification] Error:', error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Delete old notifications (admin utility)
 * Deletes notifications older than specified days
 */
export async function cleanupOldNotifications(daysOld: number = 90): Promise<{
  deleted?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Accesso negato' };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('user_notifications')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .in('status', ['read', 'action_completed', 'archived'])
    .select('id');

  if (error) {
    console.error('[cleanupOldNotifications] Error:', error);
    return { error: error.message };
  }

  return { deleted: data?.length || 0 };
}
