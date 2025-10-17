import { router, verifiedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const resourcesRouter = router({
  listDocuments: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("documents")
        .select(`
          *,
          uploader:users!uploaded_by (
            id,
            name
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  listTutorials: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("tutorials")
        .select(`
          *,
          author:users!author_id (
            id,
            name
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  uploadDocument: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      fileUrl: z.string(),
      fileType: z.string().optional(),
      fileSize: z.number().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("documents")
        .insert({
          id: nanoid(),
          tenant_id: ctx.user.tenantId,
          uploaded_by: ctx.user.id,
          title: input.title,
          description: input.description,
          file_url: input.fileUrl,
          file_type: input.fileType,
          file_size: input.fileSize,
          category: input.category,
        });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

