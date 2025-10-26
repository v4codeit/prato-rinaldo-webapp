import { router, verifiedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const announcementsRouter = router({
  list: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("announcements")
        .select(`
          *,
          author:users!author_id (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  create: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string().optional(),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("announcements")
        .insert({
          id: nanoid(),
          tenant_id: ctx.user.tenantId,
          author_id: ctx.user.id,
          title: input.title,
          content: input.content,
          category: input.category,
          is_pinned: input.isPinned,
        });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      category: z.string().optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("announcements")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", ctx.user.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("announcements")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", ctx.user.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

