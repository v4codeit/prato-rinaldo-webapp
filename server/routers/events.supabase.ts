import { router, publicProcedure, verifiedProcedure } from "../_core/trpc.supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const eventsRouter = router({
  listPublic: publicProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("events")
        .select(`
          *,
          organizer:users!organizer_id (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", input.tenantId)
        .eq("event_type", "public")
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  listPrivate: verifiedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("events")
        .select(`
          *,
          organizer:users!organizer_id (
            id,
            name,
            avatar
          )
        `)
        .eq("tenant_id", ctx.user.tenantId)
        .in("event_type", ["private", "public"])
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  getById: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("events")
        .select(`
          *,
          organizer:users!organizer_id (
            id,
            name,
            avatar,
            bio
          )
        `)
        .eq("id", input.eventId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  rsvp: verifiedProcedure
    .input(z.object({
      eventId: z.string(),
      status: z.enum(["going", "maybe", "not_going"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if RSVP already exists
      const { data: existing } = await ctx.supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", input.eventId)
        .eq("user_id", ctx.user.id)
        .single();

      if (existing) {
        // Update existing RSVP
        // @ts-ignore - TODO: Fix Supabase client types
        const { error } = await ctx.supabase
          .from("event_rsvps")
          .update({
            status: input.status,
            notes: input.notes,
          })
          .eq("id", existing.id);

        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
      } else {
        // Create new RSVP
        // @ts-ignore - TODO: Fix Supabase client types
        const { error } = await ctx.supabase
          .from("event_rsvps")
          .insert({
            id: nanoid(),
            event_id: input.eventId,
            user_id: ctx.user.id,
            status: input.status,
            notes: input.notes,
          });

        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
      }

      return { success: true };
    }),

  getRsvps: verifiedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("event_rsvps")
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            avatar
          )
        `)
        .eq("event_id", input.eventId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),
});

