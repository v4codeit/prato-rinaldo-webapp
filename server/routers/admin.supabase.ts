import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  listPendingUsers: adminProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select("*")
        .eq("tenant_id", ctx.user.tenantId)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  listAllUsers: adminProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select("*")
        .eq("tenant_id", ctx.user.tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("users")
        .update({ verification_status: "approved" })
        .eq("id", input.userId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  rejectUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("users")
        .update({ verification_status: "rejected" })
        .eq("id", input.userId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  updateUserRoles: adminProcedure
    .input(z.object({
      userId: z.string(),
      adminRole: z.enum(['super_admin', 'admin', 'moderator']).nullable().optional(),
      committeeRole: z.enum(['president', 'vice_president', 'secretary', 'treasurer', 'board_member', 'council_member']).nullable().optional(),
      isInBoard: z.boolean().optional(),
      isInCouncil: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...roles } = input;

      const updates: any = {};
      if (roles.adminRole !== undefined) updates.admin_role = roles.adminRole;
      if (roles.committeeRole !== undefined) updates.committee_role = roles.committeeRole;
      if (roles.isInBoard !== undefined) updates.is_in_board = roles.isInBoard;
      if (roles.isInCouncil !== undefined) updates.is_in_council = roles.isInCouncil;

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  getStatistics: adminProcedure
    .query(async ({ ctx }) => {
      // Get counts for various entities
      const [usersCount, articlesCount, eventsCount, marketplaceCount] = await Promise.all([
        ctx.supabase.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId),
        ctx.supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId),
        ctx.supabase.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId),
        ctx.supabase.from("marketplace_items").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId),
      ]);

      return {
        totalUsers: usersCount.count || 0,
        totalArticles: articlesCount.count || 0,
        totalEvents: eventsCount.count || 0,
        totalMarketplaceItems: marketplaceCount.count || 0,
      };
    }),

  getTenantSettings: adminProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("tenants")
        .select("*")
        .eq("id", ctx.user.tenantId)
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  updateTenantSettings: adminProcedure
    .input(z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      logo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("tenants")
        .update(input)
        .eq("id", ctx.user.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

