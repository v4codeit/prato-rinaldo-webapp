import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  tenants,
  articles,
  events,
  eventRsvps,
  marketplaceItems,
  professionalProfiles,
  reviews,
  documents,
  tutorials,
  tutorialRequests,
  announcements,
  forumCategories,
  forumThreads,
  forumPosts,
  badges,
  userBadges,
  type Tenant,
  type Article,
  type Event,
  type EventRsvp,
  type MarketplaceItem,
  type ProfessionalProfile,
  type Review,
  type Document,
  type Tutorial,
  type Announcement,
  type ForumCategory,
  type ForumThread,
  type ForumPost,
  type Badge,
  type UserBadge,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }
  if (!user.tenantId) {
    throw new Error("Tenant ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
      tenantId: user.tenantId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "bio", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'super_admin';
        values.role = 'super_admin';
        updateSet.role = 'super_admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function updateUserVerificationStatus(userId: string, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ verificationStatus: status }).where(eq(users.id, userId));
}

// ============ TENANTS ============

export async function getTenant(id: string): Promise<Tenant | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ARTICLES ============

export async function getPublicArticles(tenantId: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(and(eq(articles.tenantId, tenantId), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticleBySlug(tenantId: string, slug: string): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.tenantId, tenantId), eq(articles.slug, slug)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ EVENTS ============

export async function getPublicEvents(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.tenantId, tenantId),
        eq(events.status, "published"),
        eq(events.isPrivate, false)
      )
    )
    .orderBy(asc(events.startDate));
}

export async function getPrivateEvents(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.tenantId, tenantId),
        eq(events.status, "published"),
        eq(events.isPrivate, true)
      )
    )
    .orderBy(asc(events.startDate));
}

export async function getEventById(eventId: string): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ MARKETPLACE ============

export async function getApprovedMarketplaceItems(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(marketplaceItems)
    .where(and(eq(marketplaceItems.tenantId, tenantId), eq(marketplaceItems.status, "approved")))
    .orderBy(desc(marketplaceItems.createdAt));
}

export async function getMarketplaceItemById(itemId: string): Promise<MarketplaceItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PROFESSIONAL PROFILES ============

export async function getActiveProfessionalProfiles(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      profile: professionalProfiles,
      user: users,
    })
    .from(professionalProfiles)
    .innerJoin(users, eq(professionalProfiles.userId, users.id))
    .where(and(eq(users.tenantId, tenantId), eq(professionalProfiles.isActive, true)))
    .orderBy(desc(professionalProfiles.createdAt));
}

export async function getProfessionalProfileByUserId(userId: string): Promise<ProfessionalProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ DOCUMENTS & TUTORIALS ============

export async function getDocumentsByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(documents)
    .where(eq(documents.tenantId, tenantId))
    .orderBy(desc(documents.createdAt));
}

export async function getPublishedTutorials(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tutorials)
    .where(and(eq(tutorials.tenantId, tenantId), eq(tutorials.status, "published")))
    .orderBy(desc(tutorials.createdAt));
}

// ============ ANNOUNCEMENTS ============

export async function getAnnouncements(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(announcements)
    .where(eq(announcements.tenantId, tenantId))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

// ============ FORUM ============

export async function getForumCategories(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.tenantId, tenantId))
    .orderBy(asc(forumCategories.order));
}

export async function getForumThreadsByCategory(categoryId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(forumThreads)
    .where(eq(forumThreads.categoryId, categoryId))
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.updatedAt));
}

export async function getForumPostsByThread(threadId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.threadId, threadId))
    .orderBy(asc(forumPosts.createdAt));
}

// ============ GAMIFICATION ============

export async function getBadgesByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(badges)
    .where(eq(badges.tenantId, tenantId))
    .orderBy(desc(badges.points));
}

export async function getUserBadges(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      userBadge: userBadges,
      badge: badges,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));
}

export async function getUserPoints(userId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      totalPoints: sql<number>`SUM(${badges.points})`,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));

  return result[0]?.totalPoints ?? 0;
}



// ============ ONBOARDING ============
export async function updateUserOnboarding(userId: string, data: {
  membershipType?: 'resident' | 'domiciled' | 'landowner';
  street?: string;
  streetNumber?: string;
  zipCode?: string;
  municipality?: 'san_cesareo' | 'zagarolo';
  householdSize?: number;
  hasMinors?: boolean;
  minorsCount?: number;
  hasSeniors?: boolean;
  seniorsCount?: number;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
}) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set(data)
    .where(eq(users.id, userId));
}

// ============ ROLES ============
export async function updateUserRoles(userId: string, data: {
  adminRole?: 'super_admin' | 'admin' | 'moderator' | null;
  adminPermissions?: any;
  committeeRole?: 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'board_member' | 'council_member' | null;
  isInBoard?: boolean;
  isInCouncil?: boolean;
}) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set(data)
    .where(eq(users.id, userId));
}

export async function getUsersByRole(tenantId: string, role: 'admin' | 'super_admin' | 'moderator') {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.adminRole, role)
    ));
}

export async function getUsersByMembershipType(tenantId: string, type: 'resident' | 'domiciled' | 'landowner') {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.membershipType, type)
    ));
}

export async function getBoardMembers(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.isInBoard, true)
    ));
}

export async function getCouncilMembers(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.isInCouncil, true)
    ));
}

// ============ USER ACTIVITIES ============
export async function getUserEvents(userId: string) {
  const db = await getDb();
  if (!db) return { upcoming: [], past: [], rsvps: [] };

  const now = new Date();

  // Get user's RSVPs
  const rsvps = await db.select()
    .from(eventRsvps)
    .where(eq(eventRsvps.userId, userId));

  const rsvpEventIds = rsvps.map(r => r.eventId);

  // Get upcoming events with RSVP
  const upcomingWithRsvp = await db.select()
    .from(events)
    .where(and(
      sql`${events.id} IN (${rsvpEventIds.join(',')})`,
      sql`${events.startDate} > ${now}`
    ));

  // Get past events with RSVP
  const pastEvents = await db.select()
    .from(events)
    .where(and(
      sql`${events.id} IN (${rsvpEventIds.join(',')})`,
      sql`${events.startDate} <= ${now}`
    ));

  return {
    upcoming: upcomingWithRsvp,
    past: pastEvents,
    rsvps: rsvps,
  };
}

export async function getUserMarketplaceItems(userId: string) {
  const db = await getDb();
  if (!db) return { active: [], sold: [] };

  const active = await db.select()
    .from(marketplaceItems)
    .where(and(
      eq(marketplaceItems.sellerId, userId),
      sql`${marketplaceItems.status} = 'available'`
    ));

  const sold = await db.select()
    .from(marketplaceItems)
    .where(and(
      eq(marketplaceItems.sellerId, userId),
      sql`${marketplaceItems.status} = 'sold'`
    ));

  return { active, sold };
}

export async function getUserForumActivity(userId: string) {
  const db = await getDb();
  if (!db) return { threads: [], posts: [] };

  const threads = await db.select()
    .from(forumThreads)
    .where(eq(forumThreads.authorId, userId))
    .limit(10);

  const posts = await db.select()
    .from(forumPosts)
    .where(eq(forumPosts.authorId, userId))
    .limit(20);

  return { threads, posts };
}

// ============ TENANT SETTINGS ============
export async function getTenantSettings(tenantId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTenantSettings(tenantId: string, data: Partial<Tenant>) {
  const db = await getDb();
  if (!db) return;

  await db.update(tenants)
    .set(data)
    .where(eq(tenants.id, tenantId));
}

// ============ STATISTICS ============
export async function getTenantStatistics(tenantId: string) {
  const db = await getDb();
  if (!db) return null;

  const totalUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  const verifiedUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.verificationStatus, 'approved')
    ));

  const pendingUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      eq(users.verificationStatus, 'pending')
    ));

  const totalEvents = await db.select({ count: sql<number>`count(*)` })
    .from(events)
    .where(eq(events.tenantId, tenantId));

  const activeMarketplaceItems = await db.select({ count: sql<number>`count(*)` })
    .from(marketplaceItems)
    .where(and(
      eq(marketplaceItems.tenantId, tenantId),
      sql`${marketplaceItems.status} = 'available'`
    ));

  const totalThreads = await db.select({ count: sql<number>`count(*)` })
    .from(forumThreads);

  return {
    totalUsers: totalUsers[0]?.count || 0,
    verifiedUsers: verifiedUsers[0]?.count || 0,
    pendingUsers: pendingUsers[0]?.count || 0,
    totalEvents: totalEvents[0]?.count || 0,
    activeMarketplaceItems: activeMarketplaceItems[0]?.count || 0,
    totalThreads: totalThreads[0]?.count || 0,
  };
}

