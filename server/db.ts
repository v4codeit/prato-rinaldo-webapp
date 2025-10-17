import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
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
  moderationQueue,
  moderationActionsLog,
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


// ============ MODERATION ============

export async function getModerationQueue(tenantId: string, filters?: {
  status?: string;
  itemType?: string;
  assignedTo?: string;
  priority?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(moderationQueue.tenantId, tenantId)];
  
  if (filters?.status) {
    conditions.push(eq(moderationQueue.status, filters.status as any));
  }
  if (filters?.itemType) {
    conditions.push(eq(moderationQueue.itemType, filters.itemType as any));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(moderationQueue.assignedTo, filters.assignedTo));
  }
  if (filters?.priority) {
    conditions.push(eq(moderationQueue.priority, filters.priority as any));
  }
  
  return await db.select()
    .from(moderationQueue)
    .where(and(...conditions))
    .orderBy(desc(moderationQueue.createdAt));
}

export async function getModerationStats(tenantId: string) {
  const db = await getDb();
  if (!db) return null;

  const totalPending = await db.select({ count: sql<number>`count(*)` })
    .from(moderationQueue)
    .where(and(
      eq(moderationQueue.tenantId, tenantId),
      eq(moderationQueue.status, 'pending')
    ));

  const byType = await db.select({
    itemType: moderationQueue.itemType,
    count: sql<number>`count(*)`
  })
    .from(moderationQueue)
    .where(and(
      eq(moderationQueue.tenantId, tenantId),
      eq(moderationQueue.status, 'pending')
    ))
    .groupBy(moderationQueue.itemType);

  const highPriority = await db.select({ count: sql<number>`count(*)` })
    .from(moderationQueue)
    .where(and(
      eq(moderationQueue.tenantId, tenantId),
      eq(moderationQueue.status, 'pending'),
      sql`${moderationQueue.priority} IN ('high', 'urgent')`
    ));

  return {
    totalPending: totalPending[0]?.count || 0,
    byType: byType,
    highPriority: highPriority[0]?.count || 0,
  };
}

export async function createModerationQueueItem(data: {
  tenantId: string;
  itemType: string;
  itemId: string;
  itemTitle: string;
  itemContent?: string;
  itemCreatorId: string;
  itemCreatorName: string;
  priority?: string;
}) {
  const db = await getDb();
  if (!db) return;

  const id = nanoid();
  
  await db.insert(moderationQueue).values({
    id,
    tenantId: data.tenantId,
    itemType: data.itemType as any,
    itemId: data.itemId,
    itemTitle: data.itemTitle,
    itemContent: data.itemContent,
    itemCreatorId: data.itemCreatorId,
    itemCreatorName: data.itemCreatorName,
    status: 'pending',
    priority: (data.priority || 'medium') as any,
    reportCount: 0,
  });

  // Log action
  await logModerationAction({
    tenantId: data.tenantId,
    queueItemId: id,
    itemType: data.itemType,
    itemId: data.itemId,
    action: 'created',
    performedBy: data.itemCreatorId,
    performedByName: data.itemCreatorName,
  });

  return id;
}

export async function approveModerationItem(
  queueItemId: string,
  moderatorId: string,
  moderatorName: string,
  note?: string
) {
  const db = await getDb();
  if (!db) return;

  // Get queue item
  const item = await db.select().from(moderationQueue).where(eq(moderationQueue.id, queueItemId)).limit(1);
  if (item.length === 0) return;

  const queueItem = item[0];

  // Update queue item
  await db.update(moderationQueue)
    .set({
      status: 'approved',
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      moderationNote: note,
    })
    .where(eq(moderationQueue.id, queueItemId));

  // Update original item based on type
  await updateOriginalItemStatus(queueItem.itemType, queueItem.itemId, 'approved', moderatorId, note);

  // Log action
  await logModerationAction({
    tenantId: queueItem.tenantId,
    queueItemId,
    itemType: queueItem.itemType,
    itemId: queueItem.itemId,
    action: 'approved',
    performedBy: moderatorId,
    performedByName: moderatorName,
    previousStatus: queueItem.status,
    newStatus: 'approved',
    note,
  });
}

export async function rejectModerationItem(
  queueItemId: string,
  moderatorId: string,
  moderatorName: string,
  note: string
) {
  const db = await getDb();
  if (!db) return;

  const item = await db.select().from(moderationQueue).where(eq(moderationQueue.id, queueItemId)).limit(1);
  if (item.length === 0) return;

  const queueItem = item[0];

  await db.update(moderationQueue)
    .set({
      status: 'rejected',
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      moderationNote: note,
    })
    .where(eq(moderationQueue.id, queueItemId));

  await updateOriginalItemStatus(queueItem.itemType, queueItem.itemId, 'rejected', moderatorId, note);

  await logModerationAction({
    tenantId: queueItem.tenantId,
    queueItemId,
    itemType: queueItem.itemType,
    itemId: queueItem.itemId,
    action: 'rejected',
    performedBy: moderatorId,
    performedByName: moderatorName,
    previousStatus: queueItem.status,
    newStatus: 'rejected',
    note,
  });
}

async function updateOriginalItemStatus(
  itemType: string,
  itemId: string,
  status: string,
  moderatorId: string,
  note?: string
) {
  const db = await getDb();
  if (!db) return;

  switch (itemType) {
    case 'marketplace':
      await db.update(marketplaceItems)
        .set({
          status: status as any,
          approvedBy: moderatorId,
          approvedAt: new Date(),
        })
        .where(eq(marketplaceItems.id, itemId));
      break;

    case 'professional_profile':
      await db.update(professionalProfiles)
        .set({
          status: status as any,
          moderatedBy: moderatorId,
          moderatedAt: new Date(),
          moderationNote: note,
        })
        .where(eq(professionalProfiles.id, itemId));
      break;

    case 'tutorial_request':
      await db.update(tutorialRequests)
        .set({
          status: status === 'approved' ? 'in_progress' : 'rejected' as any,
        })
        .where(eq(tutorialRequests.id, itemId));
      break;
  }
}

export async function reportItem(
  tenantId: string,
  itemType: string,
  itemId: string,
  reportedBy: string,
  reportedByName: string,
  reason: string
) {
  const db = await getDb();
  if (!db) return;

  // Find or create queue item
  const existing = await db.select()
    .from(moderationQueue)
    .where(and(
      eq(moderationQueue.itemType, itemType as any),
      eq(moderationQueue.itemId, itemId)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const item = existing[0];
    const reportReasonsList = item.reportReasons ? JSON.parse(item.reportReasons as any) : [];
    
    reportReasonsList.push({ userId: reportedBy, userName: reportedByName, reason, date: new Date() });

    const newReportCount = (item.reportCount || 0) + 1;
    let newPriority = item.priority;
    if (newReportCount >= 5) newPriority = 'urgent';
    else if (newReportCount >= 3) newPriority = 'high';

    await db.update(moderationQueue)
      .set({
        reportCount: newReportCount,
        reportReasons: JSON.stringify(reportReasonsList),
        priority: newPriority as any,
      })
      .where(eq(moderationQueue.id, item.id));

    // Log report action
    await logModerationAction({
      tenantId: item.tenantId,
      queueItemId: item.id,
      itemType: item.itemType,
      itemId: item.itemId,
      action: 'reported',
      performedBy: reportedBy,
      performedByName: reportedByName,
      note: reason,
    });
  } else {
    // Create new queue item for reported content
    // Get item details based on type
    let itemTitle = '';
    let itemContent = '';
    let itemCreatorId = '';
    let itemCreatorName = '';

    switch (itemType) {
      case 'marketplace': {
        const marketItem = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId)).limit(1);
        if (marketItem.length > 0) {
          itemTitle = marketItem[0].title;
          itemContent = marketItem[0].description || '';
          itemCreatorId = marketItem[0].sellerId;
          const creator = await getUser(itemCreatorId);
          itemCreatorName = creator?.name || 'Unknown';
        }
        break;
      }
      case 'professional_profile': {
        const profile = await db.select().from(professionalProfiles).where(eq(professionalProfiles.id, itemId)).limit(1);
        if (profile.length > 0) {
          itemTitle = profile[0].title;
          itemContent = profile[0].description || '';
          itemCreatorId = profile[0].userId;
          const creator = await getUser(itemCreatorId);
          itemCreatorName = creator?.name || 'Unknown';
        }
        break;
      }
      case 'forum_thread': {
        const thread = await db.select().from(forumThreads).where(eq(forumThreads.id, itemId)).limit(1);
        if (thread.length > 0) {
          itemTitle = thread[0].title;
          itemContent = thread[0].content;
          itemCreatorId = thread[0].authorId;
          const creator = await getUser(itemCreatorId);
          itemCreatorName = creator?.name || 'Unknown';
        }
        break;
      }
      case 'forum_post': {
        const post = await db.select().from(forumPosts).where(eq(forumPosts.id, itemId)).limit(1);
        if (post.length > 0) {
          itemTitle = 'Forum Post';
          itemContent = post[0].content;
          itemCreatorId = post[0].authorId;
          const creator = await getUser(itemCreatorId);
          itemCreatorName = creator?.name || 'Unknown';
        }
        break;
      }
    }

    const queueId = await createModerationQueueItem({
      tenantId,
      itemType,
      itemId,
      itemTitle,
      itemContent,
      itemCreatorId,
      itemCreatorName,
      priority: 'medium',
    });

    if (queueId) {
      // Update with report info
      await db.update(moderationQueue)
        .set({
          reportCount: 1,
          reportReasons: JSON.stringify([{ userId: reportedBy, userName: reportedByName, reason, date: new Date() }]),
        })
        .where(eq(moderationQueue.id, queueId));
    }
  }

  // Update original item's report fields
  switch (itemType) {
    case 'marketplace':
      await db.update(marketplaceItems)
        .set({
          // reportCount: sql`${marketplaceItems.reportCount} + 1`,
          // isReported: true,
        })
        .where(eq(marketplaceItems.id, itemId));
      break;
    case 'professional_profile':
      await db.update(professionalProfiles)
        .set({
          reportCount: sql`${professionalProfiles.reportCount} + 1`,
          isReported: true,
        })
        .where(eq(professionalProfiles.id, itemId));
      break;
    case 'forum_thread':
      await db.update(forumThreads)
        .set({
          reportCount: sql`${forumThreads.reportCount} + 1`,
          isReported: true,
        })
        .where(eq(forumThreads.id, itemId));
      break;
    case 'forum_post':
      await db.update(forumPosts)
        .set({
          reportCount: sql`${forumPosts.reportCount} + 1`,
          isReported: true,
        })
        .where(eq(forumPosts.id, itemId));
      break;
  }
}

async function logModerationAction(data: {
  tenantId: string;
  queueItemId: string;
  itemType: string;
  itemId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  previousStatus?: string;
  newStatus?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(moderationActionsLog).values({
    id: nanoid(),
    tenantId: data.tenantId,
    queueItemId: data.queueItemId,
    itemType: data.itemType,
    itemId: data.itemId,
    action: data.action as any,
    performedBy: data.performedBy,
    performedByName: data.performedByName,
    previousStatus: data.previousStatus,
    newStatus: data.newStatus,
    note: data.note,
  });
}

