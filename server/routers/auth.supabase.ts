import { router, publicProcedure, protectedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Database } from "../../lib/supabase/database.types";

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();
    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
    return { success: true } as const;
  }),
  
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Database['public']['Tables']['users']['Update'] = {
        name: input.name,
        bio: input.bio,
        phone: input.phone,
        avatar: input.avatar,
      };
      
      const { error } = await ctx.supabase
        .from('users')
        // @ts-ignore - TODO: Fix Supabase client types
        .update(updateData)
        .eq('id', ctx.user.id);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),
  
  completeOnboarding: protectedProcedure
    .input(z.object({
      membershipType: z.enum(['resident', 'domiciled', 'landowner']),
      street: z.string(),
      streetNumber: z.string(),
      zipCode: z.string().optional(),
      municipality: z.enum(['san_cesareo', 'zagarolo']),
      householdSize: z.number().optional(),
      hasMinors: z.boolean().optional(),
      minorsCount: z.number().optional(),
      hasSeniors: z.boolean().optional(),
      seniorsCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Database['public']['Tables']['users']['Update'] = {
        membership_type: input.membershipType,
        street: input.street,
        street_number: input.streetNumber,
        zip_code: input.zipCode,
        municipality: input.municipality,
        household_size: input.householdSize,
        has_minors: input.hasMinors,
        minors_count: input.minorsCount,
        has_seniors: input.hasSeniors,
        seniors_count: input.seniorsCount,
        onboarding_completed: true,
        onboarding_step: 2,
      };
      
      const { error } = await ctx.supabase
        .from('users')
        // @ts-ignore - TODO: Fix Supabase client types
        .update(updateData)
        .eq('id', ctx.user.id);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),
});

