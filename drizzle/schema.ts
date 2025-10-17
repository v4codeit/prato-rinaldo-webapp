import { mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, int, index, json } from "drizzle-orm/mysql-core";

/**
 * MULTI-TENANT ARCHITECTURE
 * Ogni tabella (tranne users e tenants) include tenant_id per l'isolamento dei dati
 */

// ============ TENANTS ============
export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#0891b2"),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#f97316"),
  heroImage: varchar("heroImage", { length: 500 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  socialFacebook: varchar("socialFacebook", { length: 500 }),
  socialInstagram: varchar("socialInstagram", { length: 500 }),
  socialTwitter: varchar("socialTwitter", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  maintenanceMode: boolean("maintenanceMode").default(false).notNull(),
  maintenanceMessage: text("maintenanceMessage"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "suspended", "cancelled"]).default("trial").notNull(),
  subscriptionType: mysqlEnum("subscriptionType", ["monthly", "annual"]),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ============ USERS ============
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  // Onboarding fields
  membershipType: mysqlEnum("membershipType", ["resident", "domiciled", "landowner"]),
  street: varchar("street", { length: 255 }),
  streetNumber: varchar("streetNumber", { length: 20 }),
  zipCode: varchar("zipCode", { length: 10 }).default("00030"),
  municipality: mysqlEnum("municipality", ["san_cesareo", "zagarolo"]),
  
  // Household info (optional)
  householdSize: int("householdSize"),
  hasMinors: boolean("hasMinors").default(false),
  minorsCount: int("minorsCount"),
  hasSeniors: boolean("hasSeniors").default(false),
  seniorsCount: int("seniorsCount"),
  
  // Admin roles and permissions
  adminRole: mysqlEnum("adminRole", ["super_admin", "admin", "moderator"]),
  adminPermissions: json("adminPermissions"),
  
  // Committee roles
  committeeRole: mysqlEnum("committeeRole", ["president", "vice_president", "secretary", "treasurer", "board_member", "council_member"]),
  isInBoard: boolean("isInBoard").default(false),
  isInCouncil: boolean("isInCouncil").default(false),
  
  // Onboarding tracking
  onboardingCompleted: boolean("onboardingCompleted").default(false),
  onboardingStep: int("onboardingStep").default(0),
  
  // Existing fields
  phone: varchar("phone", { length: 50 }),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ ARTICLES (News/Blog) ============
export const articles = mysqlTable("articles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 500 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  authorIdx: index("author_idx").on(table.authorId),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ============ EVENTS ============
export const events = mysqlTable("events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  organizerId: varchar("organizerId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 500 }),
  coverImage: varchar("coverImage", { length: 500 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  maxAttendees: int("maxAttendees"),
  requiresPayment: boolean("requiresPayment").default(false).notNull(),
  price: int("price").default(0),
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  organizerIdx: index("organizer_idx").on(table.organizerId),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ============ EVENT RSVPS ============
export const eventRsvps = mysqlTable("event_rsvps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["going", "maybe", "not_going"]).default("going").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  eventIdx: index("event_idx").on(table.eventId),
  userIdx: index("user_idx").on(table.userId),
}));

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

// ============ MARKETPLACE ITEMS ============
export const marketplaceItems = mysqlTable("marketplace_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  sellerId: varchar("sellerId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  comitteePercentage: int("comitteePercentage").default(0).notNull(),
  images: text("images"),
  status: mysqlEnum("status", ["pending", "approved", "sold", "rejected"]).default("pending").notNull(),
  approvedBy: varchar("approvedBy", { length: 64 }),
  approvedAt: timestamp("approvedAt"),
  soldAt: timestamp("soldAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  sellerIdx: index("seller_idx").on(table.sellerId),
}));

export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = typeof marketplaceItems.$inferInsert;

// ============ PROFESSIONAL PROFILES ============
export const professionalProfiles = mysqlTable("professional_profiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isVolunteer: boolean("isVolunteer").default(false).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  categoryIdx: index("category_idx").on(table.category),
}));

export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = typeof professionalProfiles.$inferInsert;

// ============ REVIEWS ============
export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 64 }).primaryKey(),
  professionalProfileId: varchar("professionalProfileId", { length: 64 }).notNull(),
  reviewerId: varchar("reviewerId", { length: 64 }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  profileIdx: index("profile_idx").on(table.professionalProfileId),
  reviewerIdx: index("reviewer_idx").on(table.reviewerId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ============ DOCUMENTS ============
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  uploadedBy: varchar("uploadedBy", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============ TUTORIALS ============
export const tutorials = mysqlTable("tutorials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  coverImage: varchar("coverImage", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;

// ============ TUTORIAL REQUESTS ============
export const tutorialRequests = mysqlTable("tutorial_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  requesterId: varchar("requesterId", { length: 64 }).notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type TutorialRequest = typeof tutorialRequests.$inferSelect;
export type InsertTutorialRequest = typeof tutorialRequests.$inferInsert;

// ============ ANNOUNCEMENTS ============
export const announcements = mysqlTable("announcements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ============ FORUM CATEGORIES ============
export const forumCategories = mysqlTable("forum_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = typeof forumCategories.$inferInsert;

// ============ FORUM THREADS ============
export const forumThreads = mysqlTable("forum_threads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  categoryId: varchar("categoryId", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.categoryId),
  authorIdx: index("author_idx").on(table.authorId),
}));

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = typeof forumThreads.$inferInsert;

// ============ FORUM POSTS ============
export const forumPosts = mysqlTable("forum_posts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  threadId: varchar("threadId", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  threadIdx: index("thread_idx").on(table.threadId),
  authorIdx: index("author_idx").on(table.authorId),
}));

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

// ============ BADGES ============
export const badges = mysqlTable("badges", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 500 }),
  criteria: text("criteria"),
  points: int("points").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// ============ USER BADGES ============
export const userBadges = mysqlTable("user_badges", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  badgeId: varchar("badgeId", { length: 64 }).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  badgeIdx: index("badge_idx").on(table.badgeId),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;
