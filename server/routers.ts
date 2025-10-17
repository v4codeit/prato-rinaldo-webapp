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

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  articles: articlesRouter,
  events: eventsRouter,
  marketplace: marketplaceRouter,
  professionals: professionalsRouter,
  forum: forumRouter,
  // TODO: Implement these routers
  admin: router({}),
  announcements: router({}),
  resources: router({}),
  gamification: router({}),
  moderation: router({}),
});

export type AppRouter = typeof appRouter;

