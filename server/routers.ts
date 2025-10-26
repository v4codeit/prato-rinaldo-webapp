/**
 * Supabase-based tRPC Routers
 * 
 * This file exports all migrated routers that use Supabase instead of Drizzle ORM.
 * These routers are ready to replace the old routers.ts file.
 */

import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./routers/auth.supabase";
import { usersRouter } from "./routers/users.supabase";
import { articlesRouter } from "./routers/articles.supabase";
import { eventsRouter } from "./routers/events.supabase";
import { marketplaceRouter } from "./routers/marketplace.supabase";
import { professionalsRouter } from "./routers/professionals.supabase";
import { forumRouter } from "./routers/forum.supabase";
import { adminRouter } from "./routers/admin.supabase";
import { announcementsRouter } from "./routers/announcements.supabase";
import { resourcesRouter } from "./routers/resources.supabase";
import { moderationRouter } from "./routers/moderation.supabase";
import { gamificationRouter } from "./routers/gamification.supabase";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  articles: articlesRouter,
  events: eventsRouter,
  marketplace: marketplaceRouter,
  professionals: professionalsRouter,
  forum: forumRouter,
  admin: adminRouter,
  announcements: announcementsRouter,
  resources: resourcesRouter,
  gamification: gamificationRouter,
  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;

