const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { ApiClient } = require("@twurple/api");
const { AppTokenAuthProvider } = require("@twurple/auth");

const { default: Redis } = require("ioredis");
const redis = new Redis();

const {
  showWhoAddFavorite
} = require("../controllers/ProfileController");
const {
  fetchBotToken,
  fetchToken
} = require("../utils/Token");
const {
  getUserColor,
  saveNotification,
  stream_Day,
  updateUserStreak
} = require("../controllers/configController");
const { getFavoriteChannels, getIO } = require("../utils/socket");

const router = express.Router();

const SECRET = process.env.EVENTSUB_SECRET; 

const CALLBACK_URL = "https://arabbot.store/api/twitch/webhook";
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

const authProvider = new AppTokenAuthProvider(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET);

let OAUTH_TOKEN = "";

async function getAccessToken() {
  try {
    const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    });

    OAUTH_TOKEN = res.data.access_token;
    console.log("🔐 OAuth token acquired successfully.");
  } catch (err) {
    console.error("❌ Error getting OAuth token:", err.response?.data || err.message);
  }
}

function verifySignature(secret, message, signature) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  const expectedSignature = "sha256=" + hmac.digest("hex");
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

async function subscribeToEvent(type, userId) {
  try {
    const response = await axios.post("https://api.twitch.tv/helix/eventsub/subscriptions", {
      type,
      version: "1",
      condition: { broadcaster_user_id: userId.toString() },
      transport: {
        method: "webhook",
        callback: CALLBACK_URL,
        secret: SECRET,
      },
    }, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${OAUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return { success: true, message: `Subscribed to ${type}`, userId };
  } catch (err) {
    if (err.response?.status === 409) {
      return { success: true, message: `Already subscribed to ${type}`, userId };
    }

    console.error(`❌ Failed to subscribe to ${type} for user ${userId}:`, err.response?.data || err.message);
    return { success: false, message: `Failed to subscribe to ${type}`, userId };
  }
}

async function getSubscriptions() {
  try {
    const res = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${OAUTH_TOKEN}`,
      },
    });
    
    return res.data.data || [];
  } catch (err) {
    console.error("❌ Error fetching subscriptions:", err.response?.data || err.message);
    return [];
  }
}

router.post("/webhook", async (req, res) => {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const signature = req.header("Twitch-Eventsub-Message-Signature");
  const msgType = req.header("Twitch-Eventsub-Message-Type");
  console.log(messageId,timestamp,signature,msgType);
  
  const rawBodyString = req.body.toString("utf8");
  const message = messageId + timestamp + rawBodyString;

  if (!verifySignature(SECRET, message, signature)) {
    console.log("❌ Invalid signature");
    return res.status(403).send("Invalid signature");
  }

  const { subscription, event, challenge } = JSON.parse(rawBodyString);

  if (msgType === "webhook_callback_verification") {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  if (msgType === "notification") {
    if (subscription.type === "stream.online") {
      await handleStreamOnline(event);
    } else if (subscription.type === "stream.offline") {
      await handleStreamOffline(event);
    }
  }

  if (msgType === "revocation") {
    console.log("🔁 Subscription revoked:", subscription);
  }

  res.status(200).end();
});


// --- Handlers ---

async function handleStreamOnline(event) {
  const broadcasterId = event.broadcaster_user_id;
  try {
    const users = await showWhoAddFavorite(broadcasterId);
    const apiClient = new ApiClient({ authProvider });
    const userRes = await apiClient.users.getUserById(broadcasterId);
    const stream = await apiClient.streams.getStreamByUserId(broadcasterId);

    const streamId = stream?.id;
    const startedAt = new Date();

    await redis.hset(`streamInfo:${broadcasterId}`, {
      streamId,
      startTime: startedAt.toISOString(),
    });

    await stream_Day(streamId || event.id, broadcasterId, startedAt);

    for (const favUserId of users) {
      try {
        const userAccessToken = await fetchToken(favUserId);
        const color = await getUserColor(broadcasterId, apiClient);
       
        
        const notificationData = {
          userId: favUserId,
          streamId,
          title: stream?.title || "No Title",
          broadcaster: userRes.displayName,
          avatar: userRes.profilePictureUrl,
          color,
          startedAt,
        };

        await saveNotification(notificationData);
        sendSocketNotification(favUserId, notificationData);

      } catch (err) {
        console.error(`❌ Failed to notify user ${favUserId}:`, err.message);
      }
    }

    console.log(`🎥 Stream started by broadcasterId: ${broadcasterId}`);
  } catch (error) {
    console.error("❌ Error in stream.online handler:", error.message);
  }
}

async function handleStreamOffline(event) {
  const broadcasterId = event.broadcaster_user_id;
  try {
    const streamInfo = await redis.hgetall(`streamInfo:${broadcasterId}`);
    const streamDate = new Date(streamInfo.startTime);
    const viewers = await redis.smembers(`viewers:${broadcasterId}`);

    if (viewers.length > 0) {
      const viewerNames = await redis.hmget(`viewer_names:${broadcasterId}`, ...viewers);
      await Promise.all(viewers.map((v, i) =>
        updateUserStreak(v, viewerNames[i], broadcasterId, streamDate)
      ));
      console.log(`✅ Streaks updated for ${broadcasterId}`);
    } else {
      console.warn(`⚠️ No viewers for ${broadcasterId}`);
    }

    await redis.del(`viewers:${broadcasterId}`);
    await redis.del(`streamInfo:${broadcasterId}`);
  } catch (err) {
    console.error("❌ Error in stream.offline handler:", err.message);
  }
}

// --- Socket Helper ---
function sendSocketNotification(userId, notificationData) {
  const favoriteChannels = getFavoriteChannels();
  const io = getIO();

  const sockets = Array.from(favoriteChannels.entries())
    .filter(([_, cid]) => cid === userId)
    .map(([socketId]) => socketId);

  if (sockets.length > 0) {
    sockets.forEach(socketId => {
      io.to(socketId).emit("streamOnline", notificationData);
    });
    console.log(`📣 Sent stream notification to ${userId} via sockets: ${sockets.join(", ")}`);
  } else {
    console.log(`💾 Stream notification saved for ${userId} (user is offline)`);
  }
}

router.post("/subscribe", async (req, res) => {
  const  channelId  = '406188284'

  if (!channelId) {
    return res.status(400).json({ success: false, message: "channelId is required" });
  }

  try {
    const result = await subscribeToChannel(channelId);
    return res.status(200).json(result);
  } catch (err) {
    console.error(`❌ Failed to subscribe channel ${channelId}:`, err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

async function subscribeToChannel(channelId) {
  if (!channelId) 
  {
    console.log("Missing channelId");
    
  }



  
  try {
    const subs = await getSubscriptions();
    const already = subs.some(sub => sub.condition?.broadcaster_user_id === String(channelId));

    if (already)  {
    console.log("already subscribed");
    
  }


    const [onlineRes, offlineRes] = await Promise.all([
      subscribeToEvent("stream.online", channelId),
      subscribeToEvent("stream.offline", channelId),
    ]);

    return { success: true, channelId, action: "subscribed", result: { onlineRes, offlineRes } };
  } catch (err) {
    console.error(`❌ Error in subscribeToChannel(${channelId}):`, err.message);
    return { success: false, error: err.message };
  }
}
const deleteSubscriptionsByBroadcaster = async (broadcasterId) => {
  try {
    // 1. جلب كل الاشتراكات
    const response = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${OAUTH_TOKEN}`,
      },
    });

    const allSubs = response.data.data; // المصفوفة الحقيقية للاشتراكات

    // 2. تصفية الاشتراكات حسب broadcaster_user_id
    const subsToDelete = allSubs.filter(
      (sub) => sub.condition?.broadcaster_user_id === broadcasterId
    );

    if (subsToDelete.length === 0) {
      return {
        success: false,
        message: "No subscriptions found for this broadcaster.",
      };
    }

    // 3. حذف كل اشتراك مرتبط بهذا الـ broadcaster
    for (const sub of subsToDelete) {
      await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${OAUTH_TOKEN}`,
        },
      });

      console.log(`🗑️ Deleted subscription ${sub.id} for broadcaster ${broadcasterId}`);
    }

    return {
      success: true,
      message: "Deleted all subscriptions for broadcaster",
      count: subsToDelete.length,
    };
  } catch (error) {
    console.error("❌ Error deleting subscriptions:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

router.delete("/:broadcasterId", async (req, res) => {
  const broadcasterId = req.params.broadcasterId;

  const result = await deleteSubscriptionsByBroadcaster(broadcasterId);

  if (result.success) {
    res.status(200).json({ message: result.message, count: result.count });
  } else if (result.message) {
    res.status(404).json({ error: result.message });
  } else {
    res.status(500).json({ error: result.error || "Unknown error" });
  }
});

router.get("/matched", async (req, res) => {
  try {
    // أولاً: جلب التوكن إذا لم يكن موجود أو تريده يتجدد (هنا نفترض أنه موجود)
    if (!OAUTH_TOKEN) {
      await getAccessToken();
    }

    // جلب الاشتراكات من Twitch
    const resSubs = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${OAUTH_TOKEN}`,
      },
    });

    const subscriptions = resSubs.data.data || [];
      
    // تحويل إلى صيغة CHANNEL_ID فقط
    const subs = subscriptions.map(sub => ({
      CHANNEL_ID: sub.condition.broadcaster_user_id,type : sub.type,status:sub.status,callback: sub.transport.callback,
    }));

    // جلب المستخدمين من قاعدة البيانات
    // const users = await getUserIdsByChannelId();

    // // مطابقة القنوات مع المستخدمين
    // const matched = subs
    //   .map(sub => users.find(user => user.CHANNEL_ID === sub.CHANNEL_ID))
    //   .filter(Boolean);

     res.status(200).json({
      subs
    });
  } catch (error) {
    console.error("❌ Error in /matched:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
getAccessToken();
module.exports = {
  router,subscribeToChannel
};