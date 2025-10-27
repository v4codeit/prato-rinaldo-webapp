// Supabase Edge Function for Automatic Badge Calculation
// Triggers: Scheduled via Cron (every hour)
// Purpose: Award badges based on user achievements and activities

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Badge definitions with their criteria
const BADGE_DEFINITIONS = {
  benvenuto: {
    name: 'Benvenuto',
    slug: 'benvenuto',
    description: 'Hai completato l\'onboarding',
    points: 10,
    icon: 'user-check',
    checkCriteria: async (supabase: any, userId: string, tenantId: string) => {
      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .single();

      return data?.onboarding_completed === true;
    },
  },
  'primo-post': {
    name: 'Primo Post',
    slug: 'primo-post',
    description: 'Hai pubblicato il tuo primo post nel forum',
    points: 20,
    icon: 'message-circle',
    checkCriteria: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('status', 'approved');

      return count && count >= 1;
    },
  },
  'partecipante-attivo': {
    name: 'Partecipante Attivo',
    slug: 'partecipante-attivo',
    description: 'Hai partecipato a 5 o più eventi',
    points: 50,
    icon: 'calendar-check',
    checkCriteria: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'going');

      return count && count >= 5;
    },
  },
  venditore: {
    name: 'Venditore',
    slug: 'venditore',
    description: 'Hai venduto almeno un articolo nel marketplace',
    points: 30,
    icon: 'shopping-bag',
    checkCriteria: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('marketplace_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'sold');

      return count && count >= 1;
    },
  },
  volontario: {
    name: 'Volontario',
    slug: 'volontario',
    description: 'Hai offerto servizi come volontario',
    points: 100,
    icon: 'heart',
    checkCriteria: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('professional_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'approved')
        .in('availability', ['volunteer', 'both']);

      return count && count >= 1;
    },
  },
  contributore: {
    name: 'Contributore',
    slug: 'contributore',
    description: 'Hai donato al comitato tramite il marketplace',
    points: 75,
    icon: 'gift',
    checkCriteria: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('marketplace_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'sold')
        .gt('donation_percentage', 0);

      return count && count >= 1;
    },
  },
};

// Types
interface BadgeAwardResult {
  userId: string;
  userName: string;
  badgeName: string;
  badgeSlug: string;
  points: number;
  success: boolean;
  error?: string;
}

interface ProcessingResult {
  totalProcessed: number;
  badgesAwarded: number;
  errors: number;
  details: BadgeAwardResult[];
}

/**
 * Check if user already has a badge
 */
async function userHasBadge(
  supabase: any,
  userId: string,
  badgeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  return !!data;
}

/**
 * Award badge to user
 */
async function awardBadge(
  supabase: any,
  userId: string,
  userName: string,
  badgeId: string,
  badgeName: string,
  badgeSlug: string,
  points: number
): Promise<BadgeAwardResult> {
  try {
    // Check if user already has the badge
    const hasBadge = await userHasBadge(supabase, userId, badgeId);

    if (hasBadge) {
      return {
        userId,
        userName,
        badgeName,
        badgeSlug,
        points,
        success: false,
        error: 'Already awarded',
      };
    }

    // Award the badge
    const { error: insertError } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`Awarded badge "${badgeName}" to user ${userName} (${userId})`);

    return {
      userId,
      userName,
      badgeName,
      badgeSlug,
      points,
      success: true,
    };
  } catch (error) {
    console.error(`Error awarding badge to user ${userId}:`, error);
    return {
      userId,
      userName,
      badgeName,
      badgeSlug,
      points,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Process badges for a single user
 */
async function processBadgesForUser(
  supabase: any,
  user: any,
  badges: any[]
): Promise<BadgeAwardResult[]> {
  const results: BadgeAwardResult[] = [];

  for (const badge of badges) {
    const badgeDef = BADGE_DEFINITIONS[badge.slug as keyof typeof BADGE_DEFINITIONS];

    if (!badgeDef) {
      console.warn(`No definition found for badge: ${badge.slug}`);
      continue;
    }

    try {
      // Check if user meets the criteria for this badge
      const meetsCriteria = await badgeDef.checkCriteria(
        supabase,
        user.id,
        user.tenant_id
      );

      if (meetsCriteria) {
        const result = await awardBadge(
          supabase,
          user.id,
          user.name || user.email || 'Unknown',
          badge.id,
          badge.name,
          badge.slug,
          badge.points
        );

        if (result.success) {
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Error checking criteria for badge ${badge.slug}:`, error);
    }
  }

  return results;
}

/**
 * Main handler function
 */
Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Starting badge calculation process...');

    // Get all badges from the database
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*');

    if (badgesError) {
      throw new Error(`Failed to fetch badges: ${badgesError.message}`);
    }

    if (!badges || badges.length === 0) {
      console.log('No badges found in database');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No badges configured',
          data: { totalProcessed: 0, badgesAwarded: 0, errors: 0, details: [] },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${badges.length} badges to process`);

    // Get all verified users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, tenant_id, verification_status')
      .eq('verification_status', 'approved');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No verified users found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No verified users to process',
          data: { totalProcessed: 0, badgesAwarded: 0, errors: 0, details: [] },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Processing badges for ${users.length} users...`);

    // Process each user
    const allResults: BadgeAwardResult[] = [];
    let processedUsers = 0;

    for (const user of users) {
      const userResults = await processBadgesForUser(supabase, user, badges);
      allResults.push(...userResults);
      processedUsers++;

      // Log progress every 10 users
      if (processedUsers % 10 === 0) {
        console.log(`Processed ${processedUsers}/${users.length} users...`);
      }
    }

    // Calculate summary
    const result: ProcessingResult = {
      totalProcessed: processedUsers,
      badgesAwarded: allResults.filter((r) => r.success).length,
      errors: allResults.filter((r) => !r.success && r.error !== 'Already awarded').length,
      details: allResults.filter((r) => r.success), // Only include successful awards in details
    };

    console.log('Badge calculation completed:', {
      totalUsers: result.totalProcessed,
      badgesAwarded: result.badgesAwarded,
      errors: result.errors,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${result.totalProcessed} users, awarded ${result.badgesAwarded} badges`,
        data: result,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-badges function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
