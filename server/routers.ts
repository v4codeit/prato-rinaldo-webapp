import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import * as db from "./db";

// Helper per verificare che l'utente sia admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Helper per verificare che l'utente sia verificato
const verifiedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.verificationStatus !== 'approved') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Account verification required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUser({
          id: ctx.user.id,
          tenantId: ctx.user.tenantId,
          ...input,
        });
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
        await db.updateUserOnboarding(ctx.user.id, {
          ...input,
          onboardingCompleted: true,
          onboardingStep: 2,
        });
        return { success: true };
      }),
  }),

  // ============ USERS ============
  users: router({
    getProfile: protectedProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        return await db.getUser(input.userId);
      }),
    
    getPublicProfile: publicProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        const user = await db.getUser(input.userId);
        if (!user) return null;
        // Return only public fields
        return {
          id: user.id,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          committeeRole: user.committeeRole,
          isInBoard: user.isInBoard,
          isInCouncil: user.isInCouncil,
          createdAt: user.createdAt,
        };
      }),
    
    getActivities: protectedProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        const events = await db.getUserEvents(input.userId);
        const marketplace = await db.getUserMarketplaceItems(input.userId);
        const forum = await db.getUserForumActivity(input.userId);
        return { events, marketplace, forum };
      }),
  }),

  // ============ ARTICLES (Public Area) ============
  articles: router({
    list: publicProcedure
      .input(z.object({
        tenantId: z.string(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        return await db.getPublicArticles(input.tenantId, input.limit);
      }),
    
    getBySlug: publicProcedure
      .input(z.object({
        tenantId: z.string(),
        slug: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getArticleBySlug(input.tenantId, input.slug);
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
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { articles } = await import("../drizzle/schema");
        await db.insert(articles).values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          authorId: ctx.user.id,
          publishedAt: input.status === "published" ? new Date() : undefined,
          ...input,
        });

        return { success: true };
      }),
  }),

  // ============ EVENTS ============
  events: router({
    listPublic: publicProcedure
      .input(z.object({ tenantId: z.string() }))
      .query(async ({ input }) => {
        return await db.getPublicEvents(input.tenantId);
      }),

    listPrivate: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getPrivateEvents(ctx.user.tenantId);
      }),

    getById: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        return await db.getEventById(input.eventId);
      }),

    rsvp: verifiedProcedure
      .input(z.object({
        eventId: z.string(),
        status: z.enum(["going", "maybe", "not_going"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { eventRsvps } = await import("../drizzle/schema");
        const existing = await db.getUserEventRsvp(input.eventId, ctx.user.id);

        if (existing) {
          await dbInstance.update(eventRsvps)
            .set({ status: input.status, notes: input.notes })
            .where(eq(eventRsvps.id, existing.id));
        } else {
          await dbInstance.insert(eventRsvps).values({
            id: nanoid(),
            eventId: input.eventId,
            userId: ctx.user.id,
            status: input.status,
            notes: input.notes,
          });
        }

        return { success: true };
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        coverImage: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        isPrivate: z.boolean().default(false),
        maxAttendees: z.number().optional(),
        requiresPayment: z.boolean().default(false),
        price: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { events } = await import("../drizzle/schema");
        await dbInstance.insert(events).values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          organizerId: ctx.user.id,
          status: "published",
          ...input,
        });

        return { success: true };
      }),
  }),

  // ============ MARKETPLACE ============
  marketplace: router({
    list: publicProcedure
      .input(z.object({ tenantId: z.string() }))
      .query(async ({ input }) => {
        return await db.getApprovedMarketplaceItems(input.tenantId);
      }),

    getById: publicProcedure
      .input(z.object({ itemId: z.string() }))
      .query(async ({ input }) => {
        return await db.getMarketplaceItemById(input.itemId);
      }),

    create: verifiedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        price: z.number(),
        comitteePercentage: z.number().min(0).max(100).default(0),
        images: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { marketplaceItems } = await import("../drizzle/schema");
        await dbInstance.insert(marketplaceItems).values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          sellerId: ctx.user.id,
          status: "pending",
          ...input,
        });

        return { success: true };
      }),

    approve: adminProcedure
      .input(z.object({ itemId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { marketplaceItems } = await import("../drizzle/schema");
        await dbInstance.update(marketplaceItems)
          .set({ 
            status: "approved", 
            approvedBy: ctx.user.id,
            approvedAt: new Date(),
          })
          .where(eq(marketplaceItems.id, input.itemId));

        return { success: true };
      }),
  }),

  // ============ PROFESSIONAL PROFILES ============
  professionals: router({
    list: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getActiveProfessionalProfiles(ctx.user.tenantId);
      }),

    getMyProfile: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getProfessionalProfileByUserId(ctx.user.id);
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
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { professionalProfiles } = await import("../drizzle/schema");
        const existing = await db.getProfessionalProfileByUserId(ctx.user.id);

        if (existing) {
          await dbInstance.update(professionalProfiles)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(professionalProfiles.id, existing.id));
        } else {
          await dbInstance.insert(professionalProfiles).values({
            id: nanoid(),
            userId: ctx.user.id,
            isActive: true,
            ...input,
          });
        }

        return { success: true };
      }),
  }),

  // ============ DOCUMENTS & TUTORIALS ============
  resources: router({
    listDocuments: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getDocumentsByTenant(ctx.user.tenantId);
      }),

    listTutorials: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getPublishedTutorials(ctx.user.tenantId);
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
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { documents } = await import("../drizzle/schema");
        await dbInstance.insert(documents).values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          uploadedBy: ctx.user.id,
          ...input,
        });

        return { success: true };
      }),
  }),

  // ============ ANNOUNCEMENTS ============
  announcements: router({
    list: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getAnnouncements(ctx.user.tenantId);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
        isPinned: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { announcements } = await import("../drizzle/schema");
        await dbInstance.insert(announcements).values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          authorId: ctx.user.id,
          ...input,
        });

        return { success: true };
      }),
  }),

  // ============ FORUM ============
  forum: router({
    listCategories: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getForumCategories(ctx.user.tenantId);
      }),

    listThreads: verifiedProcedure
      .input(z.object({ categoryId: z.string() }))
      .query(async ({ input }) => {
        return await db.getForumThreadsByCategory(input.categoryId);
      }),

    listPosts: verifiedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ input }) => {
        return await db.getForumPostsByThread(input.threadId);
      }),

    createThread: verifiedProcedure
      .input(z.object({
        categoryId: z.string(),
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { forumThreads } = await import("../drizzle/schema");
        await dbInstance.insert(forumThreads).values({
          id: nanoid(),
          categoryId: input.categoryId,
          authorId: ctx.user.id,
          title: input.title,
          content: input.content,
        });

        return { success: true };
      }),

    createPost: verifiedProcedure
      .input(z.object({
        threadId: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const { forumPosts } = await import("../drizzle/schema");
        await dbInstance.insert(forumPosts).values({
          id: nanoid(),
          threadId: input.threadId,
          authorId: ctx.user.id,
          content: input.content,
        });

        return { success: true };
      }),
  }),

  // ============ GAMIFICATION ============
  gamification: router({
    listBadges: verifiedProcedure
      .query(async ({ ctx }) => {
        return await db.getBadgesByTenant(ctx.user.tenantId);
      }),

    getUserBadges: verifiedProcedure
      .input(z.object({ userId: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await db.getUserBadges(userId);
      }),

    getUserPoints: verifiedProcedure
      .input(z.object({ userId: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await db.getUserPoints(userId);
      }),
  }),

  // ============ ADMIN ============
  admin: router({
    listPendingUsers: adminProcedure
      .query(async ({ ctx }) => {
        const users = await db.getUsersByTenant(ctx.user.tenantId);
        return users.filter(u => u.verificationStatus === 'pending');
      }),

    listAllUsers: adminProcedure
      .query(async ({ ctx }) => {
        return await db.getUsersByTenant(ctx.user.tenantId);
      }),

    approveUser: adminProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateUserVerificationStatus(input.userId, 'approved');
        return { success: true };
      }),

    rejectUser: adminProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateUserVerificationStatus(input.userId, 'rejected');
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
      .mutation(async ({ input }) => {
        const { userId, ...roles } = input;
        await db.updateUserRoles(userId, roles);
        return { success: true };
      }),

    getStatistics: adminProcedure
      .query(async ({ ctx }) => {
        return await db.getTenantStatistics(ctx.user.tenantId);
      }),

    getTenantSettings: adminProcedure
      .query(async ({ ctx }) => {
        return await db.getTenantSettings(ctx.user.tenantId);
      }),

    updateTenantSettings: adminProcedure
      .input(z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        heroImage: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        socialFacebook: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialTwitter: z.string().optional(),
        maintenanceMode: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateTenantSettings(ctx.user.tenantId, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

