'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createProfessionalProfileSchema,
  createVolunteerProfileSchema,
  createReviewSchema
} from '@/lib/utils/validators';
import {
  StructuredLogger,
  logSupabaseError,
  safeJsonParse,
  isStringArray,
  PerformanceTimer,
} from '@/lib/utils/logging';

/**
 * Get all approved service profiles (professionals and volunteers)
 */
export async function getApprovedServiceProfiles(params?: {
  category?: string;
  profileType?: 'volunteer' | 'professional';
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();

  // Pagination setup
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  const offset = (page - 1) * limit;

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
    `, { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (params?.category) {
    query = query.eq('category', params.category);
  }

  if (params?.profileType) {
    query = query.eq('profile_type', params.profileType);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return {
      profiles: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  }

  return {
    profiles: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (offset + limit) < (count || 0)
    }
  };
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
        logo_url: string | null;
        portfolio_images: string[];
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
    .eq('service_profile_id', professionalId)
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
  // ============================================
  // LOGGING SETUP
  // ============================================
  const logger = new StructuredLogger('SERVICE_PROFILE_CREATE');
  const timer = new PerformanceTimer(logger, 'Create Service Profile');

  // ============================================
  // PUNTO 1: START - Log initial state
  // ============================================
  logger.start('createServiceProfile', {
    formDataKeys: Array.from(formData.keys()),
    fieldsCount: Array.from(formData.keys()).length,
  });

  // ============================================
  // PUNTO 2: AUTH CHECK
  // ============================================
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  logger.info('Auth Check', {
    authenticated: !!user,
    userId: user?.id || null,
    userEmail: user?.email || null,
  });

  if (!user) {
    logger.error('Authentication Failed - No user');
    timer.end({ success: false, reason: 'not_authenticated' });
    return { error: 'Non autenticato' };
  }

  // ============================================
  // PUNTO 3: USER PROFILE VERIFICATION - FIX: Added error check
  // ============================================
  logger.info('Fetching User Profile', { userId: user.id });

  const { data: profile, error: profileFetchError } = await supabase
    .from('users')
    .select('verification_status, tenant_id, name')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string; name: string } | null; error: any };

  if (profileFetchError) {
    logSupabaseError(logger, 'Fetch User Profile', profileFetchError, { userId: user.id });
    timer.end({ success: false, reason: 'profile_fetch_error' });
    return { error: 'Errore durante il caricamento del profilo utente' };
  }

  logger.info('User Profile Result', {
    profileFound: !!profile,
    verificationStatus: profile?.verification_status || null,
    tenantId: profile?.tenant_id || null,
  });

  if (!profile || profile.verification_status !== 'approved') {
    logger.error('Verification Failed', {
      profileExists: !!profile,
      currentStatus: profile?.verification_status || 'none',
      requiredStatus: 'approved',
    });
    timer.end({ success: false, reason: 'not_verified' });
    return { error: 'Solo gli utenti verificati possono creare un profilo' };
  }

  // ============================================
  // PUNTO 4: EXISTING PROFILE CHECK - FIX: Added error check
  // ============================================
  logger.info('Checking Existing Service Profile', { userId: user.id });

  const { data: existing, error: existingCheckError } = await supabase
    .from('service_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: any };

  if (existingCheckError && existingCheckError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected
    logSupabaseError(logger, 'Check Existing Profile', existingCheckError, { userId: user.id });
  }

  logger.info('Existing Profile Check Result', {
    existingProfileFound: !!existing,
    existingProfileId: existing?.id || null,
  });

  if (existing) {
    logger.error('Duplicate Profile', { existingId: existing.id });
    timer.end({ success: false, reason: 'duplicate_profile' });
    return { error: 'Hai già un profilo nella Community Pro' };
  }

  // ============================================
  // PUNTO 5: PROFILE TYPE
  // ============================================
  const profileType = (formData.get('profileType') as 'volunteer' | 'professional') || 'professional';

  logger.info('Profile Type', {
    profileType,
    rawValue: formData.get('profileType'),
  });

  // ============================================
  // PUNTO 6: FORMDATA PARSING - FIX: Safe JSON.parse
  // ============================================
  logger.debug('Parsing FormData - Common Fields', {
    category: formData.get('category'),
    businessName: formData.get('businessName'),
    descriptionLength: formData.get('description')?.toString().length || 0,
    servicesRaw: formData.get('services'),
    contactPhone: formData.get('contactPhone'),
    contactEmail: formData.get('contactEmail'),
    address: formData.get('address'),
    certificationsRaw: formData.get('certifications'),
  });

  // FIX: Safe JSON.parse for services
  const servicesValue = formData.get('services');
  const servicesParsed = safeJsonParse<string[]>(
    servicesValue as string,
    [],
    isStringArray
  );

  // FIX: Safe JSON.parse for certifications
  const certificationsValue = formData.get('certifications');
  const certificationsParsed = safeJsonParse<string[]>(
    certificationsValue as string,
    [],
    isStringArray
  );

  // Parse common fields
  const rawData: any = {
    category: formData.get('category') as string,
    businessName: formData.get('businessName') as string,
    description: formData.get('description') as string,
    services: servicesParsed,
    contactPhone: (formData.get('contactPhone') as string) || undefined,
    contactEmail: (formData.get('contactEmail') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    certifications: certificationsParsed,
  };

  // Add representativeName for professionals only
  if (profileType === 'professional') {
    rawData.representativeName = (formData.get('representativeName') as string) || undefined;
  }

  // Add profile-specific fields
  if (profileType === 'professional') {
    logger.debug('Parsing Professional Fields', {
      representativeName: formData.get('representativeName'),
      website: formData.get('website'),
      vatNumber: formData.get('vatNumber'),
      hourlyRate: formData.get('hourlyRate'),
    });

    rawData.website = (formData.get('website') as string) || undefined;
    const vatNumber = formData.get('vatNumber') as string;
    if (vatNumber && vatNumber.trim()) {
      rawData.vatNumber = vatNumber;
    }
    const hourlyRate = formData.get('hourlyRate') as string;
    if (hourlyRate && hourlyRate.trim()) {
      rawData.hourlyRate = parseFloat(hourlyRate);
    }
  } else if (profileType === 'volunteer') {
    logger.debug('Parsing Volunteer Fields', {
      availabilityHours: formData.get('availabilityHours'),
    });

    const availabilityHours = formData.get('availabilityHours') as string;
    if (availabilityHours && availabilityHours.trim()) {
      rawData.availabilityHours = parseInt(availabilityHours, 10);
    }
  }

  // ============================================
  // PUNTO 7: RAW DATA OBJECT
  // ============================================
  logger.debug('Raw Data Object', {
    rawData: JSON.stringify(rawData, null, 2),
    fieldsCount: Object.keys(rawData).length,
  });

  // ============================================
  // PUNTO 8: ZOD VALIDATION
  // ============================================
  const schema = profileType === 'volunteer'
    ? createVolunteerProfileSchema
    : createProfessionalProfileSchema;

  logger.info('Zod Validation Start', {
    schemaUsed: profileType === 'volunteer' ? 'createVolunteerProfileSchema' : 'createProfessionalProfileSchema',
    profileType,
  });

  const parsed = schema.safeParse(rawData);

  if (!parsed.success) {
    logger.error('Zod Validation Failed', {
      errors: parsed.error.flatten(),
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
      issues: parsed.error.issues,
      rawData: JSON.stringify(rawData, null, 2),
    });
    timer.end({ success: false, reason: 'validation_failed' });
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  logger.success('Zod Validation Passed', {
    parsedDataKeys: Object.keys(parsed.data),
  });

  // ============================================
  // PUNTO 9: MEDIA FILES - FIX: Safe JSON.parse
  // ============================================
  const logoUrl = (formData.get('logoUrl') as string) || null;

  // FIX: Safe JSON.parse for portfolioImages
  const portfolioImagesValue = formData.get('portfolioImages');
  const portfolioImages = safeJsonParse<string[]>(
    portfolioImagesValue as string,
    [],
    isStringArray
  );

  logger.info('Media Files', {
    hasLogo: !!logoUrl,
    logoUrl,
    portfolioImagesCount: portfolioImages.length,
    portfolioImages,
  });

  // ============================================
  // PUNTO 10: INSERT DATA OBJECT - FIX: Nullish coalescing for zero values
  // ============================================
  const insertData: any = {
    business_name: parsed.data.businessName,
    category: parsed.data.category,
    description: parsed.data.description,
    services: parsed.data.services,
    certifications: parsed.data.certifications || [],
    contact_phone: parsed.data.contactPhone || null,
    contact_email: parsed.data.contactEmail || null,
    address: parsed.data.address || null,
    logo_url: logoUrl,
    portfolio_images: portfolioImages,
    profile_type: profileType,
    user_id: user.id,
    tenant_id: profile.tenant_id,
    status: 'pending',
  };

  // Add profile-specific fields to insert
  if (profileType === 'professional') {
    insertData.website = (parsed.data as any).website || null;
    insertData.vat_number = (parsed.data as any).vatNumber || null;
    // FIX: Use nullish coalescing to preserve 0 value
    insertData.hourly_rate = (parsed.data as any).hourlyRate ?? null;
    insertData.representative_name = (parsed.data as any).representativeName || null;
  } else if (profileType === 'volunteer') {
    // FIX: Use nullish coalescing to preserve 0 value
    insertData.availability_hours = (parsed.data as any).availabilityHours ?? null;
  }

  logger.info('Insert Data Object', {
    insertData: JSON.stringify(insertData, null, 2),
    fieldsCount: Object.keys(insertData).length,
    columnNames: Object.keys(insertData),
  });

  // ============================================
  // VALIDATION: Runtime pre-INSERT check
  // ============================================
  logger.info('Pre-INSERT Validation', { checking: 'required fields and types' });

  if (!insertData.category || typeof insertData.category !== 'string') {
    logger.error('Validation Failed: category missing or invalid');
    timer.end({ success: false, reason: 'invalid_category' });
    return { error: 'Categoria non valida' };
  }

  if (!insertData.user_id || typeof insertData.user_id !== 'string') {
    logger.error('Validation Failed: user_id missing or invalid');
    timer.end({ success: false, reason: 'invalid_user_id' });
    return { error: 'ID utente non valido' };
  }

  if (!insertData.tenant_id || typeof insertData.tenant_id !== 'string') {
    logger.error('Validation Failed: tenant_id missing or invalid');
    timer.end({ success: false, reason: 'invalid_tenant_id' });
    return { error: 'ID tenant non valido' };
  }

  if (!Array.isArray(insertData.services) || insertData.services.length === 0) {
    logger.error('Validation Failed: services must be non-empty array');
    timer.end({ success: false, reason: 'invalid_services' });
    return { error: 'Inserisci almeno un servizio' };
  }

  // Only check hourly_rate for professionals
  if (profileType === 'professional' && insertData.hourly_rate !== null && isNaN(insertData.hourly_rate)) {
    logger.error('Validation Failed: hourly_rate is NaN');
    timer.end({ success: false, reason: 'invalid_hourly_rate' });
    return { error: 'Tariffa oraria non valida' };
  }

  // Only check availability_hours for volunteers
  if (profileType === 'volunteer' && insertData.availability_hours !== null && isNaN(insertData.availability_hours)) {
    logger.error('Validation Failed: availability_hours is NaN');
    timer.end({ success: false, reason: 'invalid_availability_hours' });
    return { error: 'Ore di disponibilità non valide' };
  }

  logger.success('Pre-INSERT Validation Passed');

  // ============================================
  // PUNTO 11: DATABASE INSERT START
  // ============================================
  logger.info('Database INSERT Start', {
    table: 'service_profiles',
    operation: 'insert',
    selectFields: ['id'],
  });

  // ============================================
  // PUNTO 12: DATABASE INSERT RESULT (CRITICAL POINT)
  // ============================================
  const { data: profileData, error: profileError } = (await supabase
    .from('service_profiles')
    .insert(insertData)
    .select('id')
    .single()) as { data: { id: string } | null; error: any };

  if (profileError || !profileData) {
    // ⭐ CRITICAL LOGGING: Full Supabase error details
    logSupabaseError(logger, 'INSERT service_profiles', profileError, {
      insertData: JSON.stringify(insertData, null, 2),
      userId: user.id,
      tenantId: profile.tenant_id,
      profileType,
    });
    timer.end({ success: false, reason: 'insert_failed' });
    return { error: 'Errore durante la creazione del profilo' };
  }

  logger.success('Database INSERT Success', {
    profileId: profileData.id,
    profileData: JSON.stringify(profileData, null, 2),
  });

  const profileId = profileData.id;

  // ============================================
  // PUNTO 13: MODERATION QUEUE INSERT START
  // ============================================
  logger.info('Moderation Queue INSERT Start', {
    itemType: 'service_profile',
    itemId: profileId,
    tenantId: profile.tenant_id,
    itemCreatorId: user.id,
    itemTitle: insertData.business_name,
  });

  // ============================================
  // PUNTO 14: MODERATION QUEUE RESULT - FIX: Safe rollback
  // ============================================
  const { error: moderationError } = await supabase.from('moderation_queue').insert({
    item_type: 'service_profile',
    item_id: profileId,
    tenant_id: profile.tenant_id,
    item_creator_id: user.id,
    item_title: insertData.business_name,
    item_creator_name: profile.name || user.email || 'Unknown',
    status: 'pending',
  });

  if (moderationError) {
    logSupabaseError(logger, 'INSERT moderation_queue', moderationError, {
      profileId,
      userId: user.id,
      tenantId: profile.tenant_id,
      willRollback: true,
    });

    // FIX: Safe rollback with error check
    logger.info('Rollback - Deleting profile', { profileId });

    const { error: deleteError } = await supabase
      .from('service_profiles')
      .delete()
      .eq('id', profileId);

    if (deleteError) {
      logger.error('ROLLBACK FAILED!', {
        profileId,
        deleteError: JSON.stringify(deleteError, null, 2),
        warning: 'INCONSISTENT STATE: Profile exists without moderation entry',
      });
    } else {
      logger.success('Rollback Successful', { deletedProfileId: profileId });
    }

    timer.end({ success: false, reason: 'moderation_insert_failed' });
    return { error: 'Errore durante l\'invio in moderazione' };
  }

  logger.success('Moderation Queue INSERT Success');

  // ============================================
  // PUNTO 15: SUCCESS END
  // ============================================
  logger.end('createServiceProfile', {
    profileId,
    profileType,
    userId: user.id,
    tenantId: profile.tenant_id,
  });

  timer.end({ success: true, profileId });

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

  // Check ownership and get current status
  const { data: professional } = await supabase
    .from('service_profiles')
    .select('user_id, status, tenant_id')
    .eq('id', professionalId)
    .single() as { data: { user_id: string; status: string; tenant_id: string } | null };

  if (!professional || professional.user_id !== user.id) {
    return { error: 'Non autorizzato' };
  }

  const profileType = (formData.get('profileType') as 'volunteer' | 'professional') || 'professional';

  // Parse common fields
  const rawData: any = {
    category: formData.get('category') as string,
    businessName: formData.get('businessName') as string,
    description: formData.get('description') as string,
    services: formData.get('services') ? JSON.parse(formData.get('services') as string) : [],
    contactPhone: (formData.get('contactPhone') as string) || undefined,
    contactEmail: (formData.get('contactEmail') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    certifications: formData.get('certifications') ? JSON.parse(formData.get('certifications') as string) : [],
  };

  // Add profile-specific fields
  if (profileType === 'professional') {
    rawData.website = (formData.get('website') as string) || undefined;
    const vatNumber = formData.get('vatNumber') as string;
    if (vatNumber && vatNumber.trim()) {
      rawData.vatNumber = vatNumber;
    }
    const hourlyRate = formData.get('hourlyRate') as string;
    if (hourlyRate && hourlyRate.trim()) {
      rawData.hourlyRate = parseFloat(hourlyRate);
    }
  } else if (profileType === 'volunteer') {
    const availabilityHours = formData.get('availabilityHours') as string;
    if (availabilityHours && availabilityHours.trim()) {
      rawData.availabilityHours = parseInt(availabilityHours, 10);
    }
  }

  // Use correct validator based on profile type
  const schema = profileType === 'volunteer'
    ? createVolunteerProfileSchema
    : createProfessionalProfileSchema;

  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Get logo and portfolio images if present
  const logoUrl = (formData.get('logoUrl') as string) || null;
  const portfolioImages = formData.get('portfolioImages')
    ? JSON.parse(formData.get('portfolioImages') as string)
    : [];

  // Prepare update data
  const updateData: any = {
    business_name: parsed.data.businessName,
    category: parsed.data.category,
    description: parsed.data.description,
    services: parsed.data.services,
    certifications: parsed.data.certifications || [],
    contact_phone: parsed.data.contactPhone || null,
    contact_email: parsed.data.contactEmail || null,
    address: parsed.data.address || null,
    logo_url: logoUrl,
    portfolio_images: portfolioImages,
    profile_type: profileType,
    status: 'pending',  // Reset status - requires re-moderation
  };

  // Add profile-specific fields to update
  if (profileType === 'professional') {
    updateData.website = (parsed.data as any).website || null;
    updateData.vat_number = (parsed.data as any).vatNumber || null;
    updateData.hourly_rate = (parsed.data as any).hourlyRate || null;
    updateData.availability_hours = null; // Clear volunteer field
  } else if (profileType === 'volunteer') {
    updateData.availability_hours = (parsed.data as any).availabilityHours || null;
    updateData.website = null; // Clear professional fields
    updateData.vat_number = null;
    updateData.hourly_rate = null;
  }

  // Update profile and reset status to pending (re-moderation required)
  const { error } = await supabase
    .from('service_profiles')
    .update(updateData)
    .eq('id', professionalId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento del profilo' };
  }

  // Create new moderation queue entry for re-moderation
  console.log('[SERVICE PROFILE UPDATE] Sending to moderation:', {
    professionalId,
    userId: user.id,
    tenantId: professional.tenant_id,
  });

  const { error: moderationError } = await supabase
    .from('moderation_queue')
    .insert({
      item_type: 'service_profile',
      item_id: professionalId,
      tenant_id: professional.tenant_id,
      item_creator_id: user.id,
      status: 'pending',
    });

  if (moderationError) {
    console.error('[SERVICE PROFILE UPDATE] Failed to create moderation queue entry:', moderationError);
    // Don't rollback the update - profile is already saved
    // But inform user of the issue
    return {
      error: 'Profilo aggiornato ma errore durante l\'invio in moderazione. Contatta il supporto.'
    };
  }

  console.log('[SERVICE PROFILE UPDATE] Moderation queue entry created successfully');

  revalidatePath('/community-pro');
  revalidatePath(`/professionals/${professionalId}`);
  revalidatePath('/bacheca');
  return {
    success: true,
    message: 'Modifiche salvate. Il profilo sarà nuovamente pubblico dopo l\'approvazione.'
  };
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
    .eq('service_profile_id', professionalId)
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
    service_profile_id: professionalId,
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

  // Query with moderation_queue join to get rejection reason
  const { data, error } = await supabase
    .from('service_profiles')
    .select(`
      *,
      moderation:moderation_queue!item_id(
        moderation_note,
        moderated_by,
        moderated_at,
        status
      )
    `)
    .eq('user_id', user.id)
    .eq('moderation.item_type', 'service_profile')
    .order('moderation.created_at', { ascending: false, foreignTable: 'moderation' })
    .limit(1, { foreignTable: 'moderation' })
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
        logo_url: string | null;
        portfolio_images: string[];
        profile_type: 'volunteer' | 'professional';
        status: 'pending' | 'approved' | 'rejected';
        created_at: string;
        updated_at: string;
        moderation: Array<{
          moderation_note: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          status: string;
        }> | null;
      } | null;
      error: any;
    };

  if (error) {
    return { professional: null };
  }

  return { professional: data };
}
