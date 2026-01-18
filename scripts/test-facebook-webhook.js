// scripts/test-facebook-webhook.js
// Simple test script to verify Facebook webhook endpoint
require("dotenv").config({ path: "./.env.local" });
const crypto = require("crypto");

async function testWebhookVerification() {
  console.log("🔍 Testing Facebook webhook verification...");

  const testUrl = `http://localhost:4000/api/webhook/facebook?hub.mode=subscribe&hub.verify_token=${process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN}&hub.challenge=test123`;

  try {
    const response = await fetch(testUrl);
    const result = await response.text();

    if (response.status === 200 && result === "test123") {
      console.log("✅ Webhook verification test passed!");
    } else {
      console.error("❌ Webhook verification test failed:", {
        status: response.status,
        result,
      });
    }
  } catch (error) {
    console.error("❌ Webhook verification test error:", error.message);
  }
}

async function testWebhookPost() {
  console.log("🔍 Testing Facebook webhook POST...");

  const testPayload = {
    entry: [
      {
        id: "test_page_id",
        time: Date.now(),
        changes: [
          {
            value: {
              form_id: "test_form_id",
              lead_id: "test_lead_" + Date.now(),
              created_time: Date.now(),
              page_id: "test_page_id",
              item: "lead",
              field_data: [
                { name: "full_name", values: ["John Doe"] },
                { name: "email", values: ["john@example.com"] },
                { name: "phone_number", values: ["+1234567890"] },
              ],
            },
          },
        ],
      },
    ],
  };

  const payloadString = JSON.stringify(testPayload);

  // Generate signature
  const signature =
    "sha256=" +
    crypto
      .createHmac(
        "sha256",
        process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET,
      )
      .update(payloadString)
      .digest("hex");

  try {
    const response = await fetch("http://localhost:4000/api/webhook/facebook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signature,
      },
      body: payloadString,
    });

    const result = await response.text();

    if (response.status === 200) {
      console.log("✅ Webhook POST test passed!");
      console.log("📋 Response:", result);
    } else {
      console.error("❌ Webhook POST test failed:", {
        status: response.status,
        result,
      });
    }
  } catch (error) {
    console.error("❌ Webhook POST test error:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Starting Facebook webhook tests...\n");

  await testWebhookVerification();
  console.log("");
  await testWebhookPost();

  console.log("\n✨ Tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testWebhookVerification, testWebhookPost };
