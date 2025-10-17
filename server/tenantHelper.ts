import { nanoid } from "nanoid";
import { getDb } from "./db";
import { tenants } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Helper per gestire il tenant di default durante la fase di sviluppo.
 * In produzione, ogni utente dovrebbe essere assegnato a un tenant specifico.
 */

const DEFAULT_TENANT_ID = "prato-rinaldo-default";
const DEFAULT_TENANT_SLUG = "prato-rinaldo";

export async function getOrCreateDefaultTenant(): Promise<string> {
  const db = await getDb();
  if (!db) {
    console.warn("[Tenant] Database not available, using hardcoded tenant ID");
    return DEFAULT_TENANT_ID;
  }

  try {
    // Verifica se il tenant di default esiste già
    const existing = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, DEFAULT_TENANT_ID))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Crea il tenant di default
    await db.insert(tenants).values({
      id: DEFAULT_TENANT_ID,
      name: "Comitato Prato Rinaldo",
      slug: DEFAULT_TENANT_SLUG,
      description: "Comitato cittadini di Prato Rinaldo - San Cesareo e Zagarolo",
      subscriptionStatus: "active",
      subscriptionType: "annual",
    });

    console.log("[Tenant] Default tenant created:", DEFAULT_TENANT_ID);
    return DEFAULT_TENANT_ID;
  } catch (error) {
    console.error("[Tenant] Error managing default tenant:", error);
    return DEFAULT_TENANT_ID;
  }
}

