/**
 * Test script for cleanup-sessions Edge Function
 *
 * This script can be used to test the function locally before deployment.
 *
 * Usage:
 *   deno run --allow-net --allow-env test.ts
 */

// Load environment variables from .env file if it exists
try {
  const env = await Deno.readTextFile(".env");
  env.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) {
      Deno.env.set(key.trim(), value.trim());
    }
  });
} catch {
  console.log("No .env file found, using system environment variables");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing required environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}

console.log("Testing cleanup-sessions function...");
console.log(`Supabase URL: ${SUPABASE_URL}`);

// Test 1: Dry run
console.log("\n=== Test 1: Dry Run ===");
const dryRunUrl = `${SUPABASE_URL}/functions/v1/cleanup-sessions?dry_run=true`;
console.log(`Calling: ${dryRunUrl}`);

const dryRunResponse = await fetch(dryRunUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
});

const dryRunResult = await dryRunResponse.json();
console.log("Dry run response:");
console.log(JSON.stringify(dryRunResult, null, 2));

// Test 2: Force execution (commented out for safety)
/*
console.log("\n=== Test 2: Force Execution ===");
const forceUrl = `${SUPABASE_URL}/functions/v1/cleanup-sessions?force=true`;
console.log(`Calling: ${forceUrl}`);

const forceResponse = await fetch(forceUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
});

const forceResult = await forceResponse.json();
console.log("Force execution response:");
console.log(JSON.stringify(forceResult, null, 2));
*/

console.log("\n=== Test Complete ===");
console.log("To run force execution, uncomment Test 2 in test.ts");
