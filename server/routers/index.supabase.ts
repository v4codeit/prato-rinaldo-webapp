/**
 * Supabase-based tRPC Routers
 * 
 * This file exports all migrated routers that use Supabase instead of Drizzle ORM.
 * These routers are ready to replace the old routers.ts file.
 */

import { router } from "../_core/trpc";
import { authRouter } from "./auth.supabase";
import { usersRouter } from "./users.supabase";
import { articlesRouter } from "./articles.supabase";
import { eventsRouter } from "./events.supabase";
import { marketplaceRouter } from "./marketplace.supabase";
import { professionalsRouter } from "./professionals.supabase";
import { forumRouter } from "./forum.supabase";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  articles: articlesRouter,
  events: eventsRouter,
  marketplace: marketplaceRouter,
  professionals: professionalsRouter,
  forum: forumRouter,
});

export type AppRouter = typeof appRouter;

