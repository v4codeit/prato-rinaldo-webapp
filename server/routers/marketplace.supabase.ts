import { router, publicProcedure, verifiedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const marketplaceRouter = router({
  list: publicProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("marketplace_items")
        .select(`
          *,
          seller:users!seller_id (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", input.tenantId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getById: publicProcedure
    .input(z.object({ itemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("marketplace_items")
        .select(`
          *,
          seller:users!seller_id (
            id,
            name,
            avatar,
            phone,
            bio
          )
        `)
        .eq("id", input.itemId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  create: verifiedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      price: z.number(),
      committeePercentage: z.number().min(0).max(100).default(0),
      images: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const itemId = nanoid();

      // 1. Insert marketplace item
      // @ts-ignore - TODO: Fix Supabase client types
      const { error: itemError } = await ctx.supabase
        .from("marketplace_items")
        .insert({
          id: itemId,
          tenant_id: ctx.user.tenantId,
          seller_id: ctx.user.id,
          title: input.title,
          description: input.description,
          price: input.price,
          committee_percentage: input.committeePercentage,
          images: input.images,
          status: "pending",
        });

      if (itemError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: itemError.message });
      }

      // 2. Create moderation queue item
      // @ts-ignore - TODO: Fix Supabase client types
      const { error: queueError } = await ctx.supabase
        .from("moderation_queue")
        .insert({
          id: nanoid(),
          tenant_id: ctx.user.tenantId,
          item_type: "marketplace",
          item_id: itemId,
          status: "pending",
          submitted_by: ctx.user.id,
        });

      if (queueError) {
        // Rollback: delete the marketplace item
        await ctx.supabase
          .from("marketplace_items")
          .delete()
          .eq("id", itemId);

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: queueError.message });
      }

      return { success: true, itemId };
    }),

  update: verifiedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      committeePercentage: z.number().min(0).max(100).optional(),
      images: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updates: any = {};
      if (updateData.title) updates.title = updateData.title;
      if (updateData.description !== undefined) updates.description = updateData.description;
      if (updateData.price) updates.price = updateData.price;
      if (updateData.committeePercentage !== undefined) updates.committee_percentage = updateData.committeePercentage;
      if (updateData.images !== undefined) updates.images = updateData.images;

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("marketplace_items")
        .update(updates)
        .eq("id", id)
        .eq("seller_id", ctx.user.id); // Security: only update own items

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  delete: verifiedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("marketplace_items")
        .delete()
        .eq("id", input.id)
        .eq("seller_id", ctx.user.id); // Security: only delete own items

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

