import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatResult {
  stat_key: string;
  stat_value: number;
  metadata?: Record<string, unknown>;
}

interface AggregationResult {
  tenant_id: string;
  tenant_name: string;
  stats: StatResult[];
  calculated_at: string;
}

/**
 * Calculate all dashboard statistics for all tenants
 * This function is scheduled to run every 6 hours via Cron
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("is_active", true);

    if (tenantsError) {
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    if (!tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active tenants found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const results: AggregationResult[] = [];

    // Calculate stats for each tenant
    for (const tenant of tenants) {
      const stats = await calculateStatsForTenant(supabase, tenant.id);

      // Upsert all stats into aggregated_stats table
      for (const stat of stats) {
        const { error: upsertError } = await supabase
          .from("aggregated_stats")
          .upsert(
            {
              tenant_id: tenant.id,
              stat_key: stat.stat_key,
              stat_value: stat.stat_value,
              metadata: stat.metadata || {},
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "tenant_id,stat_key",
            }
          );

        if (upsertError) {
          console.error(
            `Failed to upsert stat ${stat.stat_key} for tenant ${tenant.id}:`,
            upsertError
          );
        }
      }

      results.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        stats,
        calculated_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully calculated stats for ${tenants.length} tenant(s)`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in aggregate-stats function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Calculate all statistics for a specific tenant
 */
async function calculateStatsForTenant(
  supabase: ReturnType<typeof createClient>,
  tenantId: string
): Promise<StatResult[]> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const stats: StatResult[] = [];

  // ===================================================
  // USER STATISTICS
  // ===================================================

  // Total users
  const { count: totalUsers, error: usersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!usersError && totalUsers !== null) {
    stats.push({
      stat_key: "total_users",
      stat_value: totalUsers,
      metadata: { category: "users" },
    });
  }

  // Verified users (approved)
  const { count: verifiedUsers, error: verifiedError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("verification_status", "approved");

  if (!verifiedError && verifiedUsers !== null) {
    stats.push({
      stat_key: "verified_users",
      stat_value: verifiedUsers,
      metadata: { category: "users", verification_status: "approved" },
    });
  }

  // Pending verification users
  const { count: pendingUsers, error: pendingError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("verification_status", "pending");

  if (!pendingError && pendingUsers !== null) {
    stats.push({
      stat_key: "pending_verification_users",
      stat_value: pendingUsers,
      metadata: { category: "users", verification_status: "pending" },
    });
  }

  // Users by membership type
  const membershipTypes = ["resident", "domiciled", "landowner"];
  for (const membershipType of membershipTypes) {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("membership_type", membershipType);

    if (!error && count !== null) {
      stats.push({
        stat_key: `users_${membershipType}`,
        stat_value: count,
        metadata: { category: "users", membership_type: membershipType },
      });
    }
  }

  // ===================================================
  // EVENT STATISTICS
  // ===================================================

  // Total events
  const { count: totalEvents, error: eventsError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!eventsError && totalEvents !== null) {
    stats.push({
      stat_key: "events_total",
      stat_value: totalEvents,
      metadata: { category: "events" },
    });
  }

  // Events this month
  const { count: eventsThisMonth, error: eventsMonthError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("start_date", firstDayOfMonth.toISOString())
    .lt("start_date", firstDayOfNextMonth.toISOString());

  if (!eventsMonthError && eventsThisMonth !== null) {
    stats.push({
      stat_key: "events_this_month",
      stat_value: eventsThisMonth,
      metadata: {
        category: "events",
        period: "month",
        start_date: firstDayOfMonth.toISOString(),
        end_date: firstDayOfNextMonth.toISOString(),
      },
    });
  }

  // Published events
  const { count: publishedEvents, error: publishedEventsError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "published");

  if (!publishedEventsError && publishedEvents !== null) {
    stats.push({
      stat_key: "events_published",
      stat_value: publishedEvents,
      metadata: { category: "events", status: "published" },
    });
  }

  // Total RSVPs
  const { count: totalRsvps, error: rsvpsError } = await supabase
    .from("event_rsvps")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!rsvpsError && totalRsvps !== null) {
    stats.push({
      stat_key: "event_rsvps_total",
      stat_value: totalRsvps,
      metadata: { category: "events" },
    });
  }

  // ===================================================
  // MARKETPLACE STATISTICS
  // ===================================================

  // Total marketplace items
  const { count: totalMarketplace, error: marketplaceError } = await supabase
    .from("marketplace_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!marketplaceError && totalMarketplace !== null) {
    stats.push({
      stat_key: "marketplace_items_total",
      stat_value: totalMarketplace,
      metadata: { category: "marketplace" },
    });
  }

  // Sold marketplace items
  const { count: soldItems, error: soldError } = await supabase
    .from("marketplace_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_sold", true);

  if (!soldError && soldItems !== null) {
    stats.push({
      stat_key: "marketplace_items_sold",
      stat_value: soldItems,
      metadata: { category: "marketplace", is_sold: true },
    });
  }

  // Active marketplace items (approved and not sold)
  const { count: activeItems, error: activeError } = await supabase
    .from("marketplace_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .eq("is_sold", false);

  if (!activeError && activeItems !== null) {
    stats.push({
      stat_key: "marketplace_items_active",
      stat_value: activeItems,
      metadata: { category: "marketplace", status: "approved", is_sold: false },
    });
  }

  // ===================================================
  // FORUM STATISTICS
  // ===================================================

  // Total forum threads
  const { count: totalThreads, error: threadsError } = await supabase
    .from("forum_threads")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!threadsError && totalThreads !== null) {
    stats.push({
      stat_key: "forum_threads_total",
      stat_value: totalThreads,
      metadata: { category: "forum" },
    });
  }

  // Total forum posts
  const { count: totalPosts, error: postsError } = await supabase
    .from("forum_posts")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!postsError && totalPosts !== null) {
    stats.push({
      stat_key: "forum_posts_total",
      stat_value: totalPosts,
      metadata: { category: "forum" },
    });
  }

  // Forum categories
  const { count: totalCategories, error: categoriesError } = await supabase
    .from("forum_categories")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!categoriesError && totalCategories !== null) {
    stats.push({
      stat_key: "forum_categories_total",
      stat_value: totalCategories,
      metadata: { category: "forum" },
    });
  }

  // ===================================================
  // ARTICLE STATISTICS
  // ===================================================

  // Total articles
  const { count: totalArticles, error: articlesError } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!articlesError && totalArticles !== null) {
    stats.push({
      stat_key: "articles_total",
      stat_value: totalArticles,
      metadata: { category: "articles" },
    });
  }

  // Published articles
  const { count: publishedArticles, error: publishedArticlesError } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "published");

  if (!publishedArticlesError && publishedArticles !== null) {
    stats.push({
      stat_key: "articles_published",
      stat_value: publishedArticles,
      metadata: { category: "articles", status: "published" },
    });
  }

  // ===================================================
  // PROFESSIONAL PROFILES STATISTICS
  // ===================================================

  // Total professional profiles
  const { count: totalProfessionals, error: professionalsError } = await supabase
    .from("professional_profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!professionalsError && totalProfessionals !== null) {
    stats.push({
      stat_key: "professional_profiles_total",
      stat_value: totalProfessionals,
      metadata: { category: "professionals" },
    });
  }

  // Approved professional profiles
  const { count: approvedProfessionals, error: approvedProfError } = await supabase
    .from("professional_profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved");

  if (!approvedProfError && approvedProfessionals !== null) {
    stats.push({
      stat_key: "professional_profiles_approved",
      stat_value: approvedProfessionals,
      metadata: { category: "professionals", status: "approved" },
    });
  }

  // ===================================================
  // MODERATION STATISTICS
  // ===================================================

  // Pending moderation items
  const { count: pendingModeration, error: moderationError } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  if (!moderationError && pendingModeration !== null) {
    stats.push({
      stat_key: "moderation_pending",
      stat_value: pendingModeration,
      metadata: { category: "moderation", status: "pending" },
    });
  }

  // ===================================================
  // GAMIFICATION STATISTICS
  // ===================================================

  // Total badges awarded
  const { count: totalBadges, error: badgesError } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!badgesError && totalBadges !== null) {
    stats.push({
      stat_key: "badges_awarded_total",
      stat_value: totalBadges,
      metadata: { category: "gamification" },
    });
  }

  return stats;
}
