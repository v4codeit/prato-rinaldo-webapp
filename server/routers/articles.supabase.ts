import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const articlesRouter = router({
  list: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("articles")
        .select(`
          *,
          author:users!author_id (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", input.tenantId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getBySlug: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("articles")
        .select(`
          *,
          author:users!author_id (
            id,
            name,
            avatar,
            bio
          )
        `)
        .eq("tenant_id", input.tenantId)
        .eq("slug", input.slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  create: adminProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      excerpt: z.string().optional(),
      content: z.string(),
      coverImage: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const articleData = {
        id: nanoid(),
        tenant_id: ctx.user.tenantId,
        author_id: ctx.user.id,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        cover_image: input.coverImage,
        status: input.status,
        published_at: input.status === "published" ? new Date().toISOString() : null,
      };

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("articles")
        .insert(articleData);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      slug: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      coverImage: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      const updates: any = {};
      if (updateData.title) updates.title = updateData.title;
      if (updateData.slug) updates.slug = updateData.slug;
      if (updateData.excerpt !== undefined) updates.excerpt = updateData.excerpt;
      if (updateData.content) updates.content = updateData.content;
      if (updateData.coverImage !== undefined) updates.cover_image = updateData.coverImage;
      if (updateData.status) {
        updates.status = updateData.status;
        if (updateData.status === "published") {
          updates.published_at = new Date().toISOString();
        }
      }

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("articles")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", ctx.user.tenantId); // Security: only update own tenant's articles

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("articles")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", ctx.user.tenantId); // Security: only delete own tenant's articles

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

