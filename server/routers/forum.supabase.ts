import { router, verifiedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const forumRouter = router({
  listCategories: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("forum_categories")
        .select("*")
        .eq("tenant_id", ctx.user.tenantId)
        .order("display_order", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  listThreads: verifiedProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("forum_threads")
        .select(`
          *,
          author:users!author_id (
            id,
            name,
            avatar
          )
        `)
        .eq("category_id", input.categoryId)
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  listPosts: verifiedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("forum_posts")
        .select(`
          *,
          author:users!author_id (
            id,
            name,
            avatar,
            committee_role
          )
        `)
        .eq("thread_id", input.threadId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  createThread: verifiedProcedure
    .input(z.object({
      categoryId: z.string(),
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const threadId = nanoid();

      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("forum_threads")
        .insert({
          id: threadId,
          category_id: input.categoryId,
          author_id: ctx.user.id,
          title: input.title,
          content: input.content,
          is_pinned: false,
          is_locked: false,
          last_activity_at: new Date().toISOString(),
        });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true, threadId };
    }),

  createPost: verifiedProcedure
    .input(z.object({
      threadId: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postId = nanoid();

      // @ts-ignore - TODO: Fix Supabase client types
      const { error: postError } = await ctx.supabase
        .from("forum_posts")
        .insert({
          id: postId,
          thread_id: input.threadId,
          author_id: ctx.user.id,
          content: input.content,
        });

      if (postError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: postError.message });
      }

      // Update thread last activity
      // @ts-ignore - TODO: Fix Supabase client types
      await ctx.supabase
        .from("forum_threads")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", input.threadId);

      return { success: true, postId };
    }),

  deletePost: verifiedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("forum_posts")
        .delete()
        .eq("id", input.postId)
        .eq("author_id", ctx.user.id); // Security: only delete own posts

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

