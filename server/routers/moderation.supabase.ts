import { router, protectedProcedure, verifiedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

// Helper to check if user is moderator
const moderatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.user as any;
  if (!user.adminRole || !['super_admin', 'admin', 'moderator'].includes(user.adminRole)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Moderator access required' });
  }
  return next({ ctx });
});

export const moderationRouter = router({
  getQueue: moderatorProcedure
    .input(z.object({
      status: z.string().optional(),
      itemType: z.string().optional(),
      assignedTo: z.string().optional(),
      priority: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("moderation_queue")
        .select(`
          *,
          submitter:users!submitted_by (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .order("created_at", { ascending: false });

      if (input?.status) {
        query = query.eq("status", input.status);
      }
      if (input?.itemType) {
        query = query.eq("item_type", input.itemType);
      }
      if (input?.assignedTo) {
        query = query.eq("assigned_to", input.assignedTo);
      }
      if (input?.priority) {
        query = query.eq("priority", input.priority);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getStats: moderatorProcedure
    .query(async ({ ctx }) => {
      const [pending, approved, rejected] = await Promise.all([
        ctx.supabase.from("moderation_queue").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId).eq("status", "pending"),
        ctx.supabase.from("moderation_queue").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId).eq("status", "approved"),
        ctx.supabase.from("moderation_queue").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.user.tenantId).eq("status", "rejected"),
      ]);

      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
        total: (pending.count || 0) + (approved.count || 0) + (rejected.count || 0),
      };
    }),

  approve: moderatorProcedure
    .input(z.object({
      queueItemId: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update moderation queue item
      // @ts-ignore - TODO: Fix Supabase client types
      const { error: queueError } = await ctx.supabase
        .from("moderation_queue")
        .update({
          status: "approved",
          moderated_by: ctx.user.id,
          moderated_at: new Date().toISOString(),
          moderator_note: input.note,
        })
        .eq("id", input.queueItemId);

      if (queueError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: queueError.message });
      }

      // Get the queue item to update the related item
      const { data: queueItem } = await ctx.supabase
        .from("moderation_queue")
        .select("item_type, item_id")
        .eq("id", input.queueItemId)
        .single();

      if (queueItem) {
        // Update the related item status
        const tableName = queueItem.item_type === "marketplace" ? "marketplace_items" : 
                         queueItem.item_type === "professional_profile" ? "professional_profiles" :
                         queueItem.item_type === "article" ? "articles" : null;

        if (tableName) {
          // @ts-ignore - TODO: Fix Supabase client types
          await ctx.supabase
            .from(tableName)
            .update({ 
              status: "approved",
              moderated_by: ctx.user.id,
              moderated_at: new Date().toISOString(),
            })
            .eq("id", queueItem.item_id);
        }
      }

      return { success: true };
    }),

  reject: moderatorProcedure
    .input(z.object({
      queueItemId: z.string(),
      note: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update moderation queue item
      // @ts-ignore - TODO: Fix Supabase client types
      const { error: queueError } = await ctx.supabase
        .from("moderation_queue")
        .update({
          status: "rejected",
          moderated_by: ctx.user.id,
          moderated_at: new Date().toISOString(),
          moderator_note: input.note,
        })
        .eq("id", input.queueItemId);

      if (queueError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: queueError.message });
      }

      // Get the queue item to update the related item
      const { data: queueItem } = await ctx.supabase
        .from("moderation_queue")
        .select("item_type, item_id")
        .eq("id", input.queueItemId)
        .single();

      if (queueItem) {
        // Update the related item status
        const tableName = queueItem.item_type === "marketplace" ? "marketplace_items" : 
                         queueItem.item_type === "professional_profile" ? "professional_profiles" :
                         queueItem.item_type === "article" ? "articles" : null;

        if (tableName) {
          // @ts-ignore - TODO: Fix Supabase client types
          await ctx.supabase
            .from(tableName)
            .update({ 
              status: "rejected",
              moderated_by: ctx.user.id,
              moderated_at: new Date().toISOString(),
            })
            .eq("id", queueItem.item_id);
        }
      }

      return { success: true };
    }),

  report: verifiedProcedure
    .input(z.object({
      itemType: z.string(),
      itemId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("moderation_queue")
        .insert({
          id: nanoid(),
          tenant_id: ctx.user.tenantId,
          item_type: input.itemType,
          item_id: input.itemId,
          status: "pending",
          submitted_by: ctx.user.id,
          moderator_note: `Reported by user: ${input.reason}`,
          priority: "high",
        });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

