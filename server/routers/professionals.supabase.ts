import { router, verifiedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const professionalsRouter = router({
  list: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("professional_profiles")
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar,
            phone
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .eq("status", "approved")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getMyProfile: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", ctx.user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No profile found
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  createOrUpdate: verifiedProcedure
    .input(z.object({
      category: z.string(),
      title: z.string(),
      description: z.string().optional(),
      isVolunteer: z.boolean().default(false),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      website: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if profile already exists
      const { data: existing } = await ctx.supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      if (existing) {
        // Update existing profile - set to pending for re-approval
        // @ts-ignore - TODO: Fix Supabase client types
        const { error } = await ctx.supabase
          .from("professional_profiles")
          .update({
            category: input.category,
            title: input.title,
            description: input.description,
            is_volunteer: input.isVolunteer,
            contact_email: input.contactEmail,
            contact_phone: input.contactPhone,
            website: input.website,
            status: "pending",
            moderated_by: null,
            moderated_at: null,
          })
          .eq("id", existing.id);

        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }

        // Create moderation queue item
        // @ts-ignore - TODO: Fix Supabase client types
        await ctx.supabase
          .from("moderation_queue")
          .insert({
            id: nanoid(),
            tenant_id: ctx.user.tenantId,
            item_type: "professional_profile",
            item_id: existing.id,
            status: "pending",
            submitted_by: ctx.user.id,
          });

        return { success: true, profileId: existing.id };
      } else {
        // Create new profile
        const profileId = nanoid();

        // @ts-ignore - TODO: Fix Supabase client types
        const { error } = await ctx.supabase
          .from("professional_profiles")
          .insert({
            id: profileId,
            tenant_id: ctx.user.tenantId,
            user_id: ctx.user.id,
            category: input.category,
            title: input.title,
            description: input.description,
            is_volunteer: input.isVolunteer,
            contact_email: input.contactEmail,
            contact_phone: input.contactPhone,
            website: input.website,
            status: "pending",
            is_active: true,
          });

        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }

        // Create moderation queue item
        // @ts-ignore - TODO: Fix Supabase client types
        await ctx.supabase
          .from("moderation_queue")
          .insert({
            id: nanoid(),
            tenant_id: ctx.user.tenantId,
            item_type: "professional_profile",
            item_id: profileId,
            status: "pending",
            submitted_by: ctx.user.id,
          });

        return { success: true, profileId };
      }
    }),

  deactivate: verifiedProcedure
    .mutation(async ({ ctx }) => {
      // @ts-ignore - TODO: Fix Supabase client types
      const { error } = await ctx.supabase
        .from("professional_profiles")
        .update({ is_active: false })
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});

