/**
 * Test script for aggregate-stats Edge Function
 *
 * Run with: deno run --allow-net --allow-env test.ts
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

async function testAggregateStats() {
  console.log("Testing aggregate-stats Edge Function...\n");
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/aggregate-stats`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log("\nResponse:");
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("\n✓ Function executed successfully!");

      if (data.results && data.results.length > 0) {
        console.log(`\nProcessed ${data.results.length} tenant(s):`);

        data.results.forEach((result: any, index: number) => {
          console.log(`\nTenant ${index + 1}: ${result.tenant_name}`);
          console.log(`Stats calculated: ${result.stats.length}`);

          // Group stats by category
          const statsByCategory = result.stats.reduce((acc: any, stat: any) => {
            const category = stat.metadata?.category || "other";
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(stat);
            return acc;
          }, {});

          Object.entries(statsByCategory).forEach(([category, stats]: [string, any]) => {
            console.log(`\n  ${category.toUpperCase()}:`);
            stats.forEach((stat: any) => {
              console.log(`    ${stat.stat_key}: ${stat.stat_value}`);
            });
          });
        });
      }
    } else {
      console.error("\n✗ Function failed!");
      console.error(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error("\n✗ Request failed!");
    console.error(error);
  }
}

// Run the test
testAggregateStats();
