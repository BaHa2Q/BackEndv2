// testPostWebhook.js
const axios = require("axios");

async function testPostWebhook() {
  const url = "https://arabbot.store/api/twitch/webhook";

  const body = {
    subscription: { type: "stream.online" },
    event: {
      broadcaster_user_id: "406188284",
      id: "test-stream-id",
      title: "Test Stream",
    },
    challenge: "TEST_CHALLENGE"
  };

  try {
    const res = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "Twitch-Eventsub-Message-Type": "notification", // أو "webhook_callback_verification" لتجربة challenge
        "Twitch-Eventsub-Message-Id": "test123",
        "Twitch-Eventsub-Message-Timestamp": new Date().toISOString(),
        "Twitch-Eventsub-Message-Signature": "sha256=testsignature", // للاختبار فقط
      },
    });

    console.log("✅ Response:", res.data);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

testPostWebhook();
