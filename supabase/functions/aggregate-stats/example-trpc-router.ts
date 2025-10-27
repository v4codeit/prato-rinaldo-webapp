/**
 * Example tRPC Router for Admin Dashboard
 * Add this to your server/routers/admin.supabase.ts or create a new stats router
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../_core/trpc";
import { aggregatedStats } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const statsRouter = createTRPCRouter({
  /**
   * Get all aggregated stats for the current tenant
   * Returns a map of stat_key -> { value, metadata, updated_at }
   */
  getAggregatedStats: adminProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select()
      .from(aggregatedStats)
      .where(eq(aggregatedStats.tenantId, ctx.user.tenantId))
      .orderBy(desc(aggregatedStats.updatedAt));

    // Convert array to object map for easier access
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.statKey] = {
        value: Number(stat.statValue),
        metadata: stat.metadata || {},
        updatedAt: stat.updatedAt,
      };
      return acc;
    }, {} as Record<string, { value: number; metadata: any; updatedAt: Date }>);

    return statsMap;
  }),

  /**
   * Get a specific stat by key
   */
  getStatByKey: adminProcedure
    .input(z.object({ statKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const [stat] = await ctx.db
        .select()
        .from(aggregatedStats)
        .where(
          and(
            eq(aggregatedStats.tenantId, ctx.user.tenantId),
            eq(aggregatedStats.statKey, input.statKey)
          )
        )
        .limit(1);

      if (!stat) {
        return null;
      }

      return {
        value: Number(stat.statValue),
        metadata: stat.metadata || {},
        updatedAt: stat.updatedAt,
      };
    }),

  /**
   * Get stats by category (from metadata)
   */
  getStatsByCategory: adminProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const allStats = await ctx.db
        .select()
        .from(aggregatedStats)
        .where(eq(aggregatedStats.tenantId, ctx.user.tenantId));

      // Filter by category in metadata
      const categoryStats = allStats.filter(
        (stat) => stat.metadata?.category === input.category
      );

      return categoryStats.map((stat) => ({
        key: stat.statKey,
        value: Number(stat.statValue),
        metadata: stat.metadata || {},
        updatedAt: stat.updatedAt,
      }));
    }),

  /**
   * Get dashboard overview (all key metrics)
   */
  getDashboardOverview: adminProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select()
      .from(aggregatedStats)
      .where(eq(aggregatedStats.tenantId, ctx.user.tenantId));

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.statKey] = Number(stat.statValue);
      return acc;
    }, {} as Record<string, number>);

    return {
      users: {
        total: statsMap.total_users || 0,
        verified: statsMap.verified_users || 0,
        pending: statsMap.pending_verification_users || 0,
        resident: statsMap.users_resident || 0,
        domiciled: statsMap.users_domiciled || 0,
        landowner: statsMap.users_landowner || 0,
      },
      events: {
        total: statsMap.events_total || 0,
        thisMonth: statsMap.events_this_month || 0,
        published: statsMap.events_published || 0,
        rsvps: statsMap.event_rsvps_total || 0,
      },
      marketplace: {
        total: statsMap.marketplace_items_total || 0,
        sold: statsMap.marketplace_items_sold || 0,
        active: statsMap.marketplace_items_active || 0,
      },
      forum: {
        threads: statsMap.forum_threads_total || 0,
        posts: statsMap.forum_posts_total || 0,
        categories: statsMap.forum_categories_total || 0,
      },
      articles: {
        total: statsMap.articles_total || 0,
        published: statsMap.articles_published || 0,
      },
      professionals: {
        total: statsMap.professional_profiles_total || 0,
        approved: statsMap.professional_profiles_approved || 0,
      },
      moderation: {
        pending: statsMap.moderation_pending || 0,
      },
      gamification: {
        badgesAwarded: statsMap.badges_awarded_total || 0,
      },
      // Include update timestamp
      lastUpdated: stats[0]?.updatedAt || null,
    };
  }),

  /**
   * Manually trigger stats recalculation (admin only)
   * Calls the Edge Function directly
   */
  triggerStatsRecalculation: adminProcedure.mutation(async ({ ctx }) => {
    // Get Supabase URL from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error("Supabase URL not configured");
    }

    const functionUrl = `${supabaseUrl}/functions/v1/aggregate-stats`;

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ctx.supabaseSession?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger stats recalculation: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: "Stats recalculation triggered successfully",
        result,
      };
    } catch (error) {
      console.error("Error triggering stats recalculation:", error);
      throw new Error("Failed to trigger stats recalculation");
    }
  }),
});

/**
 * Example usage in React component:
 *
 * const { data: stats } = trpc.stats.getDashboardOverview.useQuery();
 *
 * return (
 *   <div>
 *     <h2>Users</h2>
 *     <p>Total: {stats?.users.total}</p>
 *     <p>Verified: {stats?.users.verified}</p>
 *
 *     <h2>Events</h2>
 *     <p>This Month: {stats?.events.thisMonth}</p>
 *
 *     <p>Last Updated: {stats?.lastUpdated?.toLocaleString()}</p>
 *   </div>
 * );
 */
