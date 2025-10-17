import { router, publicProcedure, protectedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Database } from "../../lib/supabase/database.types";

export const usersRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select("*")
        .eq("id", input.userId)
        .single();

      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return data;
    }),

  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select(`
          id,
          name,
          bio,
          avatar,
          committee_role,
          is_in_board,
          is_in_council,
          created_at
        `)
        .eq("id", input.userId)
        .single();

      if (error) {
        return null;
      }

      return data;
    }),

  /*
  // TODO: Create SQL functions for getActivities
  getActivities: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // This requires multiple queries, so we use rpc calls for simplicity
      // These functions need to be created in Supabase SQL editor

      const { data: events, error: eventsError } = await ctx.supabase.rpc(
        "get_user_events",
        { user_id_param: input.userId }
      );

      const { data: marketplace, error: marketplaceError } = await ctx.supabase.rpc(
        "get_user_marketplace_items",
        { user_id_param: input.userId }
      );

      const { data: forum, error: forumError } = await ctx.supabase.rpc(
        "get_user_forum_activity",
        { user_id_param: input.userId }
      );

      if (eventsError || marketplaceError || forumError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user activities",
        });
      }

      return { events, marketplace, forum };
    }),
  */
});

