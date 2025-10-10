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
const { getFavoriteChannels, getIO } = require("../utils/socket");
const { saveNotification, stream_Day, updateUserStreak, getUserColor } = require("../controllers/notificationController");

const router = express.Router();
const SECRET = process.env.EVENTSUB_SECRET; 
const CALLBACK_URL = "https://yallabots.com/api/twitch/webhook";

// --- Twitch Apps ---
const TWITCH_APPS = [
  { clientId: "deqybkr1dneblsup8drmt0nbxldw9x", clientSecret: "h2dwseb7zqhje61lxnmqpnlrsqu65m", name: "App1" },
  { clientId: "wf9qq684i4d36a1nf1s5etmmyx2dsy", clientSecret: "5b5ao09qi81shj3ei2isdgmry3qmgx", name: "App2" },
];

const MAX_SUBS_PER_APP = 10000;

// --- Initialize Auth Providers ---
const authProviders = TWITCH_APPS.map(app => new AppTokenAuthProvider(app.clientId, app.clientSecret));

// --- appMap stored in Redis ---
let appMap = { App1: [], App2: [] };

async function loadAppMap() {
  const data = await redis.get("appMap");
  if (data) {
    appMap = JSON.parse(data);
  } else {
    await saveAppMap();
  }
}

async function saveAppMap() {
  await redis.set("appMap", JSON.stringify(appMap));
}

// --- OAuth Tokens for Apps ---
let oauthTokens = {}; // { App1: token, App2: token, App3: token }

async function refreshTokens() {
  for (const app of TWITCH_APPS) {
    try {
      const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
        params: {
          client_id: app.clientId,
          client_secret: app.clientSecret,
          grant_type: "client_credentials",
        },
      });
      oauthTokens[app.name] = res.data.access_token;

      // ✅ نجيب عدد الاشتراكات ونطبعه مع الرسالة
      let subsCount = 0;
      try {
        const resSubs = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
          headers: {
            "Client-ID": app.clientId,
            Authorization: `Bearer ${oauthTokens[app.name]}`,
          },
        });
        subsCount = resSubs.data.data?.length || 0;
      } catch (subErr) {
        console.error(`❌ Error fetching subscriptions for ${app.name}:`, subErr.response?.data || subErr.message);
      }

      console.log(`🔐 OAuth token acquired for ${app.name} | 📊 Subscriptions: ${subsCount}`);
    } catch (err) {
      console.error(`❌ Error getting OAuth token for ${app.name}:`, err.response?.data || err.message);
    }
  }
}

// --- Verify Signature ---
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

// 🆕 Route خاص لتنظيف appMap فقط


// --- دالة للحصول على كل الاشتراكات من كل التطبيقات ---
async function getAllSubscriptions() {
  if (!Object.keys(oauthTokens).length) await refreshTokens();

  const allSubs = [];

  for (const app of TWITCH_APPS) {
    const token = oauthTokens[app.name];
    if (!token) continue;

    try {
      const resSubs = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
        headers: {
          "Client-ID": app.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      const subscriptions = resSubs.data.data || [];
      subscriptions.forEach(sub => {
        allSubs.push({
          id: sub.id,
          channelId: sub.condition?.broadcaster_user_id,
          type: sub.type,
          status: sub.status,
          version: sub.version,
          cost: sub.cost,
          createdAt: sub.created_at,
          callback: sub.transport?.callback,
          app: app.name,
        });
      });
    } catch (err) {
      console.error(`❌ Error fetching subscriptions for ${app.name}:`, err.response?.data || err.message);
    }
  }

  return allSubs;
}

router.post("/webhook", async (req, res) => {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const signature = req.header("Twitch-Eventsub-Message-Signature");
  const msgType = req.header("Twitch-Eventsub-Message-Type");
  
  const rawBodyString = req.body.toString("utf8");
  const message = messageId + timestamp + rawBodyString;
  
  if (!verifySignature(SECRET, message, signature)) {
    console.log("❌ Invalid signature");
    return res.status(403).send("Invalid signature");
  }
  
  const { subscription, event, challenge } = JSON.parse(rawBodyString);

  if (msgType === "webhook_callback_verification") {
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

async function handleStreamOnline(event) {
  const broadcasterId = event.broadcaster_user_id;
  try {
    const users = await showWhoAddFavorite(broadcasterId,platformId=1);

    // --- تحديد App للقناة ---
    let appName = Object.keys(appMap).find(key => appMap[key].includes(broadcasterId));
    if (!appName) {
      appName = TWITCH_APPS.find(app => appMap[app.name].length < MAX_SUBS_PER_APP).name;
      appMap[appName].push(broadcasterId);
      await saveAppMap();
    }

    const appIndex = TWITCH_APPS.findIndex(a => a.name === appName);
    const apiClient = new ApiClient({ authProvider: authProviders[appIndex] });
    const userRes = await apiClient.users.getUserById(broadcasterId);
    const stream = await apiClient.streams.getStreamByUserId(broadcasterId);
    if (!stream) return; // إذا لم يكن البث مباشر
    const streamId = stream.id;
    const startedAt = new Date(stream.startedAt || new Date());

    // --- تخزين معلومات البث في Redis ---
    await redis.hset(`streamInfo:${broadcasterId}`, {
      streamId,
      startTime: startedAt.toISOString(),
    });

    await stream_Day(streamId, broadcasterId, startedAt,platformId=1);

    for (const favUserId of users) {
      try {
        const key = `notified:${favUserId}:${streamId}`;
        const alreadyNotified = await redis.get(key);
        if (alreadyNotified) {
          // تخطي الإشعار إذا تم بالفعل
          continue;
        }

        const color = await getUserColor(broadcasterId, apiClient);

        const notificationData = {
          userId: favUserId,
          streamId,
          title: stream.title,
          broadcasterName: userRes.displayName,
          broadcasterLogin: userRes.login,
          avatar: userRes.profilePictureUrl,
          color,
          startedAt,
          platformId:1
        };

        // --- حفظ في DB مع التعامل مع التكرار ---
        try {     
          await saveNotification(notificationData);
        } catch (err) {
          if (err.message.includes("unique constraint")) {
            console.log(`⚠️ Notification for user ${favUserId} and stream ${streamId} already exists.`);
          } else {
            console.error(`❌ Error saving notification for ${favUserId}:`, err.message);
          }
        }

        // --- وضع علامة في Redis لمنع التكرار ---
        await redis.set(key, "1", "EX", 3600); // تخزين لمدة ساعة
        sendSocketNotification(favUserId, notificationData);

      } catch (err) {
        console.error(`❌ Failed to notify user ${favUserId}:`, err.message);
      }
    }

  } catch (error) {
    console.error("❌ Error in stream.online handler:", error.response?.data || error.message);
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
    }

    await redis.del(`viewers:${broadcasterId}`);
    await redis.del(`streamInfo:${broadcasterId}`);
  } catch (err) {
    console.error("❌ Error in stream.offline handler:", err.message);
  }
}
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
  } 
}
async function subscribeToEvent(type, userId) {
  await loadAppMap();

  // Find which App to use
  let appName = Object.keys(appMap).find(key => appMap[key].includes(userId));
  if (!appName) {
    appName = TWITCH_APPS.find(app => appMap[app.name].length < MAX_SUBS_PER_APP).name;
    appMap[appName].push(userId);
    await saveAppMap();
  }

  const appIndex = TWITCH_APPS.findIndex(a => a.name === appName);
  const token = oauthTokens[appName];

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
        "Client-ID": TWITCH_APPS[appIndex].clientId,
        Authorization: `Bearer ${token}`,
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
  const allSubs = [];

  for (const app of TWITCH_APPS) {
    const token = oauthTokens[app.name];
    if (!token) continue;

    try {
      const res = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
        headers: {
          "Client-ID": app.clientId,
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data?.data) {
        allSubs.push(...res.data.data);
      }
    } catch (err) {
      console.error(`❌ Error fetching subscriptions for ${app.name}:`, err.response?.data || err.message);
    }
  }

  return allSubs;
}
async function subscribeToChannel(channelId) {
  if (!channelId) {
    console.log("Missing channelId");
    return { success: false, message: "Missing channelId" };
  }

  try {
    const subs = await getSubscriptions();
    const already = subs.some(sub => sub.condition?.broadcaster_user_id === String(channelId));

    if (already) {
      console.log("Already subscribed");
      return { success: true, message: "Already subscribed", channelId };
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



(async () => {
  await refreshTokens();
  await loadAppMap();
})();
// router.get("/channel-app", async (req, res) => {
//   await loadAppMap();

//   const channelsWithApp = Object.entries(appMap).map(([appName, channels]) => ({
//     appName,
//     channelIds: channels
//   }));

//   res.status(200).json(channelsWithApp);
// });



// router.post("/cleanup-all", async (req, res) => {
//   try {
//     await loadAppMap(); // تحميل appMap من Redis

//     const removedChannels = {}; // لتخزين القنوات اللي انمسحت

//     for (const app of TWITCH_APPS) {
//       const token = oauthTokens[app.name];

//       // 1️⃣ جلب كل الاشتراكات من Twitch
//       const resSubs = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
//         headers: {
//           "Client-ID": app.clientId,
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const subs = resSubs.data.data || [];
//       removedChannels[app.name] = []; // جهزنا مصفوفة القنوات اللي انمسحت من هذا التطبيق

//       // 2️⃣ حذف الاشتراكات اللي تستخدم callback تبعنا
//       for (const sub of subs) {
//         if (sub.transport?.callback === CALLBACK_URL) {
//           await axios.delete(
//             `https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`,
//             {
//               headers: {
//                 "Client-ID": app.clientId,
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );
//           console.log(`🗑️ Deleted sub ${sub.id} (${sub.type})`);

//           // --- إزالة القناة من appMap مباشرة ---
//           const broadcasterId = sub.condition?.broadcaster_user_id;
//           if (broadcasterId && appMap[app.name]?.includes(broadcasterId)) {
//             appMap[app.name] = appMap[app.name].filter(id => id !== broadcasterId);
//             removedChannels[app.name].push(broadcasterId);
//           }
//         }
//       }

//       // 3️⃣ إذا بدك تنظف الـ appMap بالكامل (زي cleanup-appmap)
//       // نحذف كل القنوات المتبقية حتى لو ما لها subscriptions
//       removedChannels[app.name].push(...appMap[app.name]);
//       appMap[app.name] = [];
//     }

//     // --- حفظ appMap بعد التعديل ---
//     await saveAppMap();

//     res.status(200).json({
//       message: "✅ Subscriptions deleted and appMap fully cleaned",
//       removedChannels,
//       newAppMap: appMap,
//     });
//   } catch (err) {
//     console.error("❌ Error in cleanup-all:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to cleanup all" });
//   }
// });
// router.get("/matched", async (req, res) => {
//   try {
//     const allSubs = await getAllSubscriptions();

//     const subs = allSubs.map(sub => ({
//       channelId: sub.channelId,
//       type: sub.type,
//       status: sub.status,
//       callback: sub.callback,
//       app: sub.app,
//     }));

//     res.status(200).json({ subs });
//   } catch (error) {
//     console.error("❌ Error in /matched:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/subscriptions", async (req, res) => {
//   try {
//     const allSubs = [];

//     for (const app of TWITCH_APPS) {
//       const token = oauthTokens[app.name];
//       const response = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
//         headers: {
//           "Client-ID": app.clientId,
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const subs = (response.data.data || []).map(sub => ({
//         id: sub.id,
//         channelId: sub.condition.broadcaster_user_id,
//         type: sub.type,
//         status: sub.status,
//         version: sub.version,
//         cost: sub.cost,
//         createdAt: sub.created_at,
//         callback: sub.transport?.callback,
//         app: app.name,
//       }));

//       allSubs.push(...subs);
//     }

//     res.status(200).json(allSubs);
//   } catch (err) {
//     console.error("❌ Error fetching subscriptions:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to fetch subscriptions" });
//   }
// });

module.exports = { router, subscribeToChannel };
