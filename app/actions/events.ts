'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEventSchema } from '@/lib/utils/validators';
import { nanoid } from 'nanoid';

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
 * Get all events (public + private for registered users)
 */
export async function getAllEvents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
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
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true });

  // If user is not logged in, show only public events
  if (!user) {
    query = query.eq('is_private', false);
  }
  // If user is logged in, show all events (public + private)

  const { data, error } = await query.limit(20);

  if (error) {
    return { events: [] };
  }

  return { events: data };
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
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
      id: nanoid(),
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
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo gli utenti verificati possono creare eventi' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    coverImage: formData.get('coverImage') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
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
    id: nanoid(),
    ...parsed.data,
    organizer_id: user.id,
    tenant_id: profile.tenant_id,
    status: 'draft' as const,
  };

  const { error } = await supabase.from('events').insert(eventData);

  if (error) {
    return { error: 'Errore durante la creazione dell\'evento' };
  }

  revalidatePath('/events');
  return { success: true };
}
