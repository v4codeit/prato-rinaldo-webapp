'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createProfessionalProfileSchema, createReviewSchema } from '@/lib/utils/validators';
import { nanoid } from 'nanoid';

/**
 * Get all approved service profiles (professionals and volunteers)
 */
export async function getApprovedServiceProfiles(params?: {
  category?: string;
  profileType?: 'volunteer' | 'professional';
}) {
  const supabase = await createClient();

  let query = supabase
    .from('service_profiles')
    .select(`
      *,
      user:users!user_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (params?.category) {
    query = query.eq('category', params.category);
  }

  if (params?.profileType) {
    query = query.eq('profile_type', params.profileType);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return { profiles: [] };
  }

  return { profiles: data };
}

/**
 * Get professional profile by ID with reviews
 */
export async function getProfessionalById(professionalId: string) {
  const supabase = await createClient();

  const { data: professional, error: professionalError } = await supabase
    .from('service_profiles')
    .select(`
      *,
      user:users!user_id (
        id,
        name,
        avatar,
        bio
      )
    `)
    .eq('id', professionalId)
    .single() as {
      data: {
        id: string;
        user_id: string;
        tenant_id: string;
        category: string;
        business_name: string;
        description: string;
        services: string[];
        contact_phone: string;
        contact_email: string;
        website: string | null;
        address: string | null;
        certifications: string[];
        status: string;
        created_at: string;
        updated_at: string;
        user: {
          id: string;
          name: string;
          avatar: string;
          bio: string;
        };
      } | null;
      error: any;
    };

  if (professionalError) {
    return { professional: null, reviews: [] };
  }

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviewer_id (
        id,
        name,
        avatar
      )
    `)
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });

  // Calculate average rating
  const avgRating = reviews && reviews.length > 0
    ? (reviews as any[]).reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    professional: { ...professional, avg_rating: avgRating, reviews_count: reviews?.length || 0 },
    reviews: reviews || [],
  };
}

/**
 * Create service profile (professional or volunteer) (verified users, goes to moderation)
 */
export async function createServiceProfile(formData: FormData) {
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
    return { error: 'Solo gli utenti verificati possono creare un profilo' };
  }

  // Check if user already has a service profile
  const { data: existing } = await supabase
    .from('service_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null };

  if (existing) {
    return { error: 'Hai già un profilo nella Community Pro' };
  }

  const profileType = formData.get('profileType') as 'volunteer' | 'professional';

  const rawData = {
    category: formData.get('category') as string,
    businessName: formData.get('businessName') as string,
    description: formData.get('description') as string,
    services: formData.get('services') ? JSON.parse(formData.get('services') as string) : [],
    contactPhone: formData.get('contactPhone') as string,
    contactEmail: formData.get('contactEmail') as string,
    website: formData.get('website') as string || undefined,
    address: formData.get('address') as string || undefined,
    certifications: formData.get('certifications') ? JSON.parse(formData.get('certifications') as string) : [],
  };

  const parsed = createProfessionalProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const profileId = nanoid();

  // Create service profile with pending status
  const { error: profileError } = await supabase.from('service_profiles').insert({
    id: profileId,
    ...parsed.data,
    profile_type: profileType || 'professional',
    user_id: user.id,
    tenant_id: profile.tenant_id,
    status: 'pending',
  });

  if (profileError) {
    return { error: 'Errore durante la creazione del profilo' };
  }

  // Create moderation queue entry
  const { error: moderationError } = await supabase.from('moderation_queue').insert({
    id: nanoid(),
    item_type: 'service_profile',
    item_id: profileId,
    tenant_id: profile.tenant_id,
    submitted_by: user.id,
    status: 'pending',
  });

  if (moderationError) {
    // Rollback profile creation
    await supabase.from('service_profiles').delete().eq('id', profileId);
    return { error: 'Errore durante l\'invio in moderazione' };
  }

  revalidatePath('/community-pro');
  return { success: true, profileId };
}

/**
 * Update professional profile (owner only)
 */
export async function updateProfessionalProfile(professionalId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership
  const { data: professional } = await supabase
    .from('service_profiles')
    .select('user_id')
    .eq('id', professionalId)
    .single() as { data: { user_id: string } | null };

  if (!professional || professional.user_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const rawData = {
    category: formData.get('category') as string,
    businessName: formData.get('businessName') as string,
    description: formData.get('description') as string,
    services: formData.get('services') ? JSON.parse(formData.get('services') as string) : [],
    contactPhone: formData.get('contactPhone') as string,
    contactEmail: formData.get('contactEmail') as string,
    website: formData.get('website') as string || undefined,
    address: formData.get('address') as string || undefined,
    certifications: formData.get('certifications') ? JSON.parse(formData.get('certifications') as string) : [],
  };

  const parsed = createProfessionalProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('service_profiles')
    .update(parsed.data)
    .eq('id', professionalId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del profilo' };
  }

  revalidatePath('/community-pro');
  revalidatePath(`/professionals/${professionalId}`);
  return { success: true };
}

/**
 * Delete professional profile (owner only)
 */
export async function deleteProfessionalProfile(professionalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check ownership
  const { data: professional } = await supabase
    .from('service_profiles')
    .select('user_id')
    .eq('id', professionalId)
    .single() as { data: { user_id: string } | null };

  if (!professional || professional.user_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('service_profiles')
    .delete()
    .eq('id', professionalId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione del profilo' };
  }

  revalidatePath('/community-pro');
  return { success: true };
}

/**
 * Create review for professional (verified users only)
 */
export async function createReview(professionalId: string, formData: FormData) {
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
    return { error: 'Solo gli utenti verificati possono lasciare recensioni' };
  }

  // Check if user already reviewed this professional
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('reviewer_id', user.id)
    .single() as { data: { id: string } | null };

  if (existing) {
    return { error: 'Hai già recensito questo professionista' };
  }

  const rawData = {
    rating: parseInt(formData.get('rating') as string),
    comment: formData.get('comment') as string,
  };

  const parsed = createReviewSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase.from('reviews').insert({
    id: nanoid(),
    professional_id: professionalId,
    reviewer_id: user.id,
    tenant_id: profile.tenant_id,
    ...parsed.data,
  });

  if (error) {
    return { error: 'Errore durante la creazione della recensione' };
  }

  revalidatePath(`/professionals/${professionalId}`);
  return { success: true };
}

/**
 * Get user's own professional profile
 */
export async function getMyProfessionalProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { professional: null };
  }

  const { data, error } = await supabase
    .from('service_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as {
      data: {
        id: string;
        user_id: string;
        tenant_id: string;
        category: string;
        business_name: string;
        description: string;
        services: string[];
        contact_phone: string;
        contact_email: string;
        website: string | null;
        address: string | null;
        certifications: string[];
        status: string;
        created_at: string;
        updated_at: string;
      } | null;
      error: any;
    };

  if (error) {
    return { professional: null };
  }

  return { professional: data };
}
