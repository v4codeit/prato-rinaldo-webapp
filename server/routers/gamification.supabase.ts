import { router, verifiedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const gamificationRouter = router({
  listBadges: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("badges")
        .select("*")
        .eq("tenant_id", ctx.user.tenantId)
        .order("points_required", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getUserBadges: verifiedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      const { data, error } = await ctx.supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges!badge_id (
            id,
            name,
            description,
            icon,
            points_required
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getUserPoints: verifiedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      const { data, error } = await ctx.supabase
        .from("user_points")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No points record found, return default
          return {
            user_id: userId,
            total_points: 0,
            level: 1,
          };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),
});

