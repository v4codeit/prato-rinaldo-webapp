'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEventSchema } from '@/lib/utils/validators';

/**
 * Get all public published events
 */
export async function getPublicEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:users!organizer_id (
        id,
        name,
        avatar
      )
    `)
    .eq('status', 'published')
    .eq('is_private', false)
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(20);

  if (error) {
    return { events: [] };
  }

  return { events: data };
}

/**
 * Get all events (public + private for verified residents only)
 */
export async function getAllEvents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is a verified resident
  let isVerifiedResident = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    isVerifiedResident = profile?.verification_status === 'approved';
  }

  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name, slug),
      organizer:users!organizer_id (
        id,
        name,
        avatar
      )
    `)
    .eq('status', 'published')
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true });

  // Only verified residents can see private events
  if (!isVerifiedResident) {
    query = query.eq('is_private', false);
  }
  // If user is verified resident, show all events (public + private)

  const { data, error } = await query.limit(20);

  if (error) {
    return { events: [] };
  }

  return { events: data };
}

/**
 * Get event by ID (with access control for private events)
 */
export async function getEventById(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name, slug),
      organizer:users!organizer_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('id', eventId)
    .single() as {
      data: {
        id: string;
        title: string;
        description: string;
        location: string;
        cover_image: string;
        start_date: string;
        end_date: string;
        is_private: boolean;
        max_attendees: number;
        requires_payment: boolean;
        price: number;
        status: string;
        organizer_id: string;
        tenant_id: string;
        created_at: string;
        updated_at: string;
        organizer: {
          id: string;
          name: string;
          avatar: string;
          bio: string;
        };
      } | null;
      error: any;
    };

  if (error) {
    return { event: null };
  }

  // Check access control for private events
  if (data?.is_private) {
    if (!user) {
      return { event: null }; // Not authenticated - no access
    }

    // Check if user is verified resident
    const { data: profile } = await supabase
      .from('users')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    if (profile?.verification_status !== 'approved') {
      return { event: null }; // Not verified - no access
    }
  }

  // Get RSVP count
  const { count } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'going');

  return { event: { ...data, rsvp_count: count || 0 } };
}

/**
 * Create RSVP for event
 */
export async function createRsvp(eventId: string, status: 'going' | 'maybe' | 'not_going') {
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
    return { error: 'Solo gli utenti verificati possono rispondere agli eventi' };
  }

  // Check if RSVP already exists
  const { data: existing } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null };

  if (existing) {
    // Update existing RSVP
    const { error } = await supabase
      .from('event_rsvps')
      .update({ status })
      .eq('id', existing.id);

    if (error) {
      return { error: 'Errore durante l\'aggiornamento della risposta' };
    }
  } else {
    // Create new RSVP
    const { error } = await supabase.from('event_rsvps').insert({
      event_id: eventId,
      user_id: user.id,
      tenant_id: profile.tenant_id,
      status,
    });

    if (error) {
      return { error: 'Errore durante la creazione della risposta' };
    }
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

/**
 * Get user's RSVP for event
 */
export async function getUserRsvp(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { rsvp: null };
  }

  const { data } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single() as {
      data: {
        id: string;
        event_id: string;
        user_id: string;
        tenant_id: string;
        status: string;
        created_at: string;
        updated_at: string;
      } | null
    };

  return { rsvp: data };
}

/**
 * Create new event (verified users)
 */
export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id, committee_role')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string; committee_role: string | null } | null };

  if (!profile || !profile.committee_role) {
    return { error: 'Solo i membri del comitato possono creare eventi' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    coverImage: formData.get('coverImage') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    categoryId: formData.get('categoryId') as string,
    isPrivate: formData.get('isPrivate') === 'true',
    maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees') as string) : undefined,
    requiresPayment: formData.get('requiresPayment') === 'true',
    price: formData.get('price') ? parseInt(formData.get('price') as string) : 0,
  };

  const parsed = createEventSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const eventData = {
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    cover_image: parsed.data.coverImage,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    is_private: parsed.data.isPrivate,
    max_attendees: parsed.data.maxAttendees,
    requires_payment: parsed.data.requiresPayment,
    price: parsed.data.price,
    category_id: parsed.data.categoryId,
    organizer_id: user.id,
    tenant_id: profile.tenant_id,
    status: 'published' as const,
  };

  const { error } = await supabase.from('events').insert(eventData);

  if (error) {
    return { error: 'Errore durante la creazione dell\'evento' };
  }

  revalidatePath('/events');
  return { success: true };
}

/**
 * Update event (Board members only)
 */
export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Devi effettuare l\'accesso' };
  }

  // Check board member
  const { data: profile } = await supabase
    .from('users')
    .select('committee_role')
    .eq('id', user.id)
    .single() as { data: { committee_role: string | null } | null };

  if (!profile?.committee_role) {
    return { error: 'Solo i membri del comitato possono modificare eventi' };
  }

  // Parse form data
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    categoryId: formData.get('categoryId'),
    coverImage: formData.get('coverImage') || null,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || null,
    isPrivate: formData.get('isPrivate') === 'true',
    maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees') as string) : null,
    requiresPayment: formData.get('requiresPayment') === 'true',
    price: formData.get('price') ? parseInt(formData.get('price') as string) : 0,
  };

  // Validate
  const validation = createEventSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Update event
  const { error } = await supabase
    .from('events')
    .update({
      title: validation.data.title,
      description: validation.data.description,
      location: validation.data.location,
      category_id: validation.data.categoryId,
      cover_image: validation.data.coverImage,
      start_date: new Date(validation.data.startDate).toISOString(),
      end_date: validation.data.endDate ? new Date(validation.data.endDate).toISOString() : null,
      is_private: validation.data.isPrivate,
      max_attendees: validation.data.maxAttendees,
      requires_payment: validation.data.requiresPayment,
      price: validation.data.price,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dell\'evento' };
  }

  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);

  return { success: true, eventId };
}

/**
 * Soft delete event (Creator or President only)
 */
export async function softDeleteEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Devi effettuare l\'accesso' };
  }

  // Get event to check organizer
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single() as { data: { organizer_id: string } | null };

  if (!event) {
    return { error: 'Evento non trovato' };
  }

  // Check permissions (creator or president)
  const { canDeleteEvent } = await import('@/lib/utils/auth-helpers');
  const canDelete = await canDeleteEvent(user.id, event.organizer_id);

  if (!canDelete) {
    return { error: 'Solo il creatore o il Presidente possono eliminare eventi' };
  }

  // Soft delete (update status to 'archived')
  const { error } = await supabase
    .from('events')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione dell\'evento' };
  }

  revalidatePath('/events');

  return { success: true };
}
