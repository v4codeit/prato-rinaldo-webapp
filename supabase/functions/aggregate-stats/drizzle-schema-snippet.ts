/**
 * Add this to your Drizzle schema file (usually drizzle/schema.ts or db/schema.ts)
 *
 * This defines the aggregated_stats table for use with Drizzle ORM
 */

import { pgTable, uuid, text, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";

export const aggregatedStats = pgTable("aggregated_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  statKey: text("stat_key").notNull(),
  statValue: bigint("stat_value", { mode: "number" }).notNull().default(0),
  metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Add unique constraint for tenant_id + stat_key
// Note: This may already be defined in the SQL migration
// If using Drizzle migrations, uncomment:
// .unique("aggregated_stats_tenant_stat_key", ["tenantId", "statKey"]);

/**
 * If you're using Drizzle relations, add this to your relations file:
 */

import { relations } from "drizzle-orm";

export const aggregatedStatsRelations = relations(aggregatedStats, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aggregatedStats.tenantId],
    references: [tenants.id],
  }),
}));

/**
 * TypeScript types (auto-inferred by Drizzle):
 */

// Insert type (for creating new stats)
export type AggregatedStatInsert = typeof aggregatedStats.$inferInsert;

// Select type (for reading stats)
export type AggregatedStatSelect = typeof aggregatedStats.$inferSelect;

/**
 * Example usage in a query:
 *
 * // Get all stats for a tenant
 * const stats = await db
 *   .select()
 *   .from(aggregatedStats)
 *   .where(eq(aggregatedStats.tenantId, tenantId));
 *
 * // Get specific stat
 * const [userStat] = await db
 *   .select()
 *   .from(aggregatedStats)
 *   .where(
 *     and(
 *       eq(aggregatedStats.tenantId, tenantId),
 *       eq(aggregatedStats.statKey, "total_users")
 *     )
 *   );
 *
 * // Upsert a stat (Edge Function does this)
 * await db
 *   .insert(aggregatedStats)
 *   .values({
 *     tenantId,
 *     statKey: "total_users",
 *     statValue: 100,
 *     metadata: { category: "users" },
 *   })
 *   .onConflictDoUpdate({
 *     target: [aggregatedStats.tenantId, aggregatedStats.statKey],
 *     set: {
 *       statValue: 100,
 *       metadata: { category: "users" },
 *       updatedAt: new Date(),
 *     },
 *   });
 */
