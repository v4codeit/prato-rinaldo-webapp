/**
 * Test Script for Proposal Email Notifications
 *
 * This script tests the email notification system for:
 * 1. New comments on proposals
 * 2. Proposal status changes
 *
 * Usage:
 *   deno run --allow-net --allow-env test-proposals.ts
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/email-notifications`;

// Test data
const TEST_PROPOSAL_ID = "123e4567-e89b-12d3-a456-426614174000";
const TEST_AUTHOR_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_COMMENTER_ID = "123e4567-e89b-12d3-a456-426614174002";

// Color output helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: New Comment Notification
async function testNewComment() {
  log("\n=== Test 1: New Comment Notification ===", "cyan");

  const payload = {
    type: "INSERT",
    table: "proposal_comments",
    record: {
      id: crypto.randomUUID(),
      proposal_id: TEST_PROPOSAL_ID,
      user_id: TEST_COMMENTER_ID,
      content: "This is a test comment to verify email notifications are working correctly!",
      created_at: new Date().toISOString(),
    },
  };

  log("Sending webhook payload...", "blue");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`✅ Test passed: ${data.message}`, "green");
      log(`   Emails sent: ${data.sent}`, "green");
    } else {
      log(`❌ Test failed: ${data.error || "Unknown error"}`, "red");
      if (data.details) {
        log(`   Details: ${data.details}`, "red");
      }
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Test 2: Self-Comment (should not send email)
async function testSelfComment() {
  log("\n=== Test 2: Self-Comment (No Email) ===", "cyan");

  const payload = {
    type: "INSERT",
    table: "proposal_comments",
    record: {
      id: crypto.randomUUID(),
      proposal_id: TEST_PROPOSAL_ID,
      user_id: TEST_AUTHOR_ID, // Same as proposal author
      content: "This is the author commenting on their own proposal",
      created_at: new Date().toISOString(),
    },
  };

  log("Sending webhook payload...", "blue");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.message?.includes("author")) {
      log(`✅ Test passed: Self-comment correctly suppressed`, "green");
      log(`   Message: ${data.message}`, "green");
    } else {
      log(`❌ Test failed: Self-comment should not send email`, "red");
      log(`   Response: ${JSON.stringify(data)}`, "red");
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Test 3: Proposal Status Change
async function testStatusChange() {
  log("\n=== Test 3: Proposal Status Change ===", "cyan");

  const payload = {
    type: "UPDATE",
    table: "proposals",
    record: {
      id: TEST_PROPOSAL_ID,
      title: "Test Proposal: New Playground Equipment",
      status: "approved",
      planned_date: "2025-03-01",
      decline_reason: null,
      completed_date: null,
      updated_at: new Date().toISOString(),
    },
    old_record: {
      status: "proposed",
    },
  };

  log("Sending webhook payload...", "blue");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.sent > 0) {
      log(`✅ Test passed: ${data.message}`, "green");
      log(`   Emails sent: ${data.sent}`, "green");
    } else if (data.message?.includes("No voters")) {
      log(`⚠️  Test skipped: No voters to notify`, "yellow");
    } else {
      log(`❌ Test failed: ${data.error || "Unknown error"}`, "red");
      if (data.details) {
        log(`   Details: ${data.details}`, "red");
      }
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Test 4: Status Change to Declined
async function testDeclinedStatus() {
  log("\n=== Test 4: Declined Status with Reason ===", "cyan");

  const payload = {
    type: "UPDATE",
    table: "proposals",
    record: {
      id: TEST_PROPOSAL_ID,
      title: "Test Proposal: Expensive Feature Request",
      status: "declined",
      planned_date: null,
      decline_reason: "Budget constraints for this fiscal year",
      completed_date: null,
      updated_at: new Date().toISOString(),
    },
    old_record: {
      status: "under_review",
    },
  };

  log("Sending webhook payload...", "blue");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Test passed: ${data.message}`, "green");
      log(`   Emails sent: ${data.sent}`, "green");
    } else {
      log(`❌ Test failed: ${data.error || "Unknown error"}`, "red");
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Test 5: Invalid Event Type
async function testInvalidEventType() {
  log("\n=== Test 5: Invalid Event Type (DELETE) ===", "cyan");

  const payload = {
    type: "DELETE",
    table: "proposals",
    record: {
      id: TEST_PROPOSAL_ID,
    },
  };

  log("Sending webhook payload...", "blue");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.sent === 0) {
      log(`✅ Test passed: DELETE events correctly ignored`, "green");
    } else {
      log(`❌ Test failed: DELETE should not send emails`, "red");
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Test 6: Long Comment Truncation
async function testLongComment() {
  log("\n=== Test 6: Long Comment Truncation ===", "cyan");

  const longContent = "A".repeat(250) + " This part should be truncated in the email preview.";

  const payload = {
    type: "INSERT",
    table: "proposal_comments",
    record: {
      id: crypto.randomUUID(),
      proposal_id: TEST_PROPOSAL_ID,
      user_id: TEST_COMMENTER_ID,
      content: longContent,
      created_at: new Date().toISOString(),
    },
  };

  log(`Comment length: ${longContent.length} chars (should truncate to 200)`, "blue");

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Test passed: Long comment handled`, "green");
      log(`   Emails sent: ${data.sent}`, "green");
    } else {
      log(`❌ Test failed: ${data.error || "Unknown error"}`, "red");
    }

    return data;
  } catch (error) {
    log(`❌ Test failed with exception: ${error.message}`, "red");
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  log("\n╔════════════════════════════════════════════════════╗", "cyan");
  log("║  Proposal Email Notifications - Test Suite        ║", "cyan");
  log("╚════════════════════════════════════════════════════╝", "cyan");

  log(`\nFunction URL: ${FUNCTION_URL}`, "blue");
  log(`Using SUPABASE_URL: ${SUPABASE_URL}`, "blue");

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Run tests sequentially
  try {
    await testNewComment();
    results.passed++;
  } catch {
    results.failed++;
  }

  try {
    await testSelfComment();
    results.passed++;
  } catch {
    results.failed++;
  }

  try {
    const result = await testStatusChange();
    if (result.message?.includes("No voters")) {
      results.skipped++;
    } else {
      results.passed++;
    }
  } catch {
    results.failed++;
  }

  try {
    await testDeclinedStatus();
    results.passed++;
  } catch {
    results.failed++;
  }

  try {
    await testInvalidEventType();
    results.passed++;
  } catch {
    results.failed++;
  }

  try {
    await testLongComment();
    results.passed++;
  } catch {
    results.failed++;
  }

  // Summary
  log("\n╔════════════════════════════════════════════════════╗", "cyan");
  log("║  Test Summary                                      ║", "cyan");
  log("╚════════════════════════════════════════════════════╝", "cyan");
  log(`Passed:  ${results.passed}`, "green");
  log(`Failed:  ${results.failed}`, results.failed > 0 ? "red" : "green");
  log(`Skipped: ${results.skipped}`, "yellow");

  if (results.failed === 0) {
    log("\n🎉 All tests passed!", "green");
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, "red");
  }
}

// Execute
if (import.meta.main) {
  runAllTests();
}
