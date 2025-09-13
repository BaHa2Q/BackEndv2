
const { MoreThan, MoreThanOrEqual, Between } = require("typeorm");
const { AppDataSource } = require("../data-source");
const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");

const { fetchToken } = require("../utils/Token");
const { MenuItems } = require("../entities/MenuItemsModel");
const { NotificationStream } = require("../entities/NotificationStreamModel");
const { VwWeeklyActivity } = require("../entities/VwWeeklyActivityModel");
const { BotLogs } = require("../entities/BotLogsModel");
const { TwitchMessages } = require("../entities/TwitchMessagesModel");
const { BotLogsView } = require("../entities/BotLogsViewModel");
const { UserChannels } = require("../entities/UserChannelsModel");
const { UserSetting } = require("../entities/UserSettingModel");
const { StreamDays } = require("../entities/StreamDaysModel");
const { VwUserSummary } = require("../entities/VwUserSummary");
const { v4: uuidv4 } = require('uuid');

const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { TwitchActivity } = require("../entities/TwitchActivityModel");
const {TwitchStreaksView } = require("../entities/TwitchStreaksViewModel");
const { CreateOrUpdateChannel } = require("./CreateChannel");
const { ViewFavoriteUsers } = require("../entities/ViewFavoriteUsersModel");
const { isUserLive } = require("./ProfileController");
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
require('dotenv').config(); // Load environment variables from .env file
const getMenu = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(MenuItems);

    // جلب جميع الأوامر النشطة (active = 1)
    const menu = await repo.find({
      where: {
        active: 1,
      },
    });

    res.status(200).json(menu);
  } catch (err) {
    console.error("Error retrieving command data:", err);
    res.status(500).send("An error occurred while retrieving command data");
  }
};
const getNotifications = async (req, res) => {
    const channelId = req.user.id;

  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    const events = await repo.find({
    where: { userId:channelId },
    order: { startedAt: 'DESC' },
    });

    const unseenCount = events.filter(e => e.isSeen === 0).length;

    res.status(200).json({
    notifications: events,
    unseenCount,
    });
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الإشعارات:", err.message);
    res.status(500).json({ error: "فشل جلب الإشعارات" });
  }
}
const getNotificationsCount = async (req, res) => {
  const channelId = req.user.id;

  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  try {
    // 🔹 عدّ الإشعارات الغير مقروءة
    const notificationRepo = AppDataSource.getRepository(NotificationStream);
    const unseenCount = await notificationRepo.count({
      where: { userId: channelId, isSeen: 0 },
    });

    // 🔹 عدّ المفضلين اللي لايف
    const accessToken = await fetchToken(channelId);
    const favoritesRepo = AppDataSource.getRepository(ViewFavoriteUsers);

    let favorites = await favoritesRepo.find({
      where: { channelId: channelId },
    });

    let liveCount = 0;
    for (const user of favorites) {
      const liveStatus = await isUserLive(user.userId, accessToken);
      if (liveStatus?.isLive) {
        liveCount++;
      }
    }

    // 🔹 رجع النتيجة
    res.status(200).json({ unseenCount, liveCount });
  } catch (err) {
    console.error("❌ خطأ أثناء عدّ الإشعارات:", err.message);
    res.status(500).json({ error: "فشل في عدّ الإشعارات" });
  }
};

const markNotificationsAsSeen = async (req, res) => {
  const channelId = req.user.id;

  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    await repo.update(
      { userId: channelId, isSeen: 0 },
      { isSeen: 1 }
    );

    res.status(200).json({ message: "تم تحديد الإشعارات كمقروءة." });
  } catch (err) {
    console.error("❌ خطأ أثناء تحديث الإشعارات:", err.message);
    res.status(500).json({ error: "فشل تحديث الإشعارات" });
  }
};
const getChannelStatus = async (req, res) => {
  const channelId = req.user.id;
  const { active } = req.body; // ممكن يكون undefined لو ما أرسل

  try {
    const channelsRepo = AppDataSource.getRepository(UserChannels);
    const settingsRepo = AppDataSource.getRepository(UserSetting);

    // جلب القناة
    const channel = await channelsRepo.findOne({ where: { channelId } });
    if (!channel) return res.status(404).json({ exists: false });

    // تحديث التواريخ لو غير موجود firstJoin و آخر زيارة دائماً
    const now = new Date();
    if (!channel.firstJoin) {
      channel.firstJoin = now;
    }
    channel.lastJoin = now;
    await channelsRepo.save(channel);

    // جلب أو إنشاء إعدادات القناة
    let settings = await settingsRepo.findOne({ where: { userId: channelId } });
    if (!settings) {
      settings = settingsRepo.create({ userId: channelId, isBotActive: 0 });
    }

    // إذا أرسلنا active، حدثها
    if (typeof active === "number") {
      settings.isBotActive = active;
      await settingsRepo.save(settings);
    }

    // رجع الحالة الحالية دائماً
    return res.status(200).json({
      exists: true,
      showModal: !channel.firstJoin,
      active: settings.isBotActive === 1,
    });
  } catch (err) {
    console.error("خطأ في معالجة حالة القناة:", err);
    res.status(500).send("خطأ في السيرفر");
  }
};
const saveNotification = async ({userId,streamId,title,broadcaster,avatar,color}) => {
  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    const notification = repo.create({
      eventId:uuidv4(),
      userId,
      streamId,
      streamTitle:title,
      broadcasterName: broadcaster,
      broadcasterAvatar:avatar,
      color,
      isSeen: 0,
      // STARTED_AT يتم تعيينه تلقائيًا بفضل @CreateDateColumn
    });

    await repo.save(notification);
    
    console.log(`✅ Notification saved for ${broadcaster}`);
  } catch (err) {
    console.error("❌ Error saving notification to DB:", err.message);
  }
};
const stream_Day = async (stream_id, channel_id, stream_date) => {
  try {
    const repo = AppDataSource.getRepository(StreamDays);
   
    // تحويل التاريخ فقط للجزء الخاص بالتاريخ (YYYY-MM-DD)
        const dateObj = new Date(stream_date);
        dateObj.setHours(0, 0, 0, 0); // لجعل الوقت منتصف الليل فقط

    
    const streamDay = repo.create({
      streamId: stream_id,
      channelId: channel_id,
      streamDate: dateObj,
    });

    await repo.save(streamDay);

    console.log(`✅ Stream Day saved for ${channel_id}`);
  } catch (err) {
    console.error("❌ Error saving Stream to DB:", err.message);
  }
};
async function getTwitchUser(req, res) {
  const { user_id } = req.query;
  const channelId = req.user.id;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const accessToken = await fetchToken(channelId);

    const response = await axios.get(
      `https://api.twitch.tv/helix/users?id=${user_id}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const user = response.data.data[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ login: user.login });
  } catch (error) {
    console.error("Error fetching Twitch user:", error);
    return res.status(500).json({ error: "Error fetching Twitch user data" });
  }
}
const getWeeklyActivity = async (req, res) => {
  const channelId = req.user.id;

  try {
    const repo = AppDataSource.getRepository(VwWeeklyActivity);

    const events = await repo.find({
      where: { channelId: channelId },
      order: { logDate: 'ASC' }
    });

    if (!events || events.length === 0) {
      return res.status(200).json({
        daily: [],
        totals: {
          date_from: null,
          date_to: null,
          total_message_count: 0,
          total_command_count: 0
        }
      });
    }

    // daily data (strip extra fields)
    const daily = events.map(e => ({
      log_date: e.logDate,
      day: e.day,
      message_count: e.messageCount,
      command_count: e.commandCount
    }));

    // take totals from first row (they’re the same in all rows)
    const first = events[0];
    const totals = {
      date_from: first.dateFrom,
      date_to: first.dateTo,
      total_message_count: first.totalMessageCount,
      total_command_count: first.totalCommandCount
    };

    res.status(200).json({ daily, totals });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
async function getUserColor(userId, apiClient) {
    try {

        // جلب لون المستخدم في الدردشة
        const color = await apiClient.chat.getColorForUser(userId);
        return color; 
    } catch (err) {
        console.error('Error fetching user color:', err);
        return null;
    }
}
const getTopChat = async (req, res) => {
  const channelId = req.user.id;
  const { type, day } = req.body;

  // حماية من قيم day كبيرة جدًا لتجنب جلب بيانات ضخمة
  const maxDay = 30;
  const safeDay = Math.min(day || 1, maxDay);

  const accessToken = await fetchToken(channelId);

  // حساب بداية الفترة
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - safeDay);

  try {
    const repo = AppDataSource.getRepository(BotLogs);

    // جلب جميع السجلات لنوع معين من التاريخ المحدد
    const allLogs = await repo.find({
      where: {
        typeid: type,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
      },
    });
    
    // جلب رسائل فقط (typeid = 5)
    const messageLogs = await repo.find({
      where: {
        typeid: 5,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
      },
    });

    // جلب أوامر فقط (typeid = 10)
    const commandLogs = await repo.find({
      where: {
        typeid: 10,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
      },
    });

    // حساب عدد الرسائل لكل مستخدم
    const messageCountMap = {};
    for (const log of messageLogs) {
      const key = `${log.userid}::${log.username}`;
      if (!messageCountMap[key]) {
        messageCountMap[key] = {
          user_id: log.userid,
          username: log.username,
          count: 0,
          type: "message_count",
        };
      }
      messageCountMap[key].count++;
    }
    const topUserMessage = Object.values(messageCountMap).sort((a, b) => b.count - a.count)[0];

    // حساب عدد الأوامر لكل مستخدم
    const commandCountMap = {};
    for (const log of commandLogs) {
      const key = `${log.userid}::${log.username}`;
      if (!commandCountMap[key]) {
        commandCountMap[key] = {
          user_id: log.userid,
          username: log.username,
          count: 0,
          type: "command_count",
        };
      }
      commandCountMap[key].count++;
    }
    const topUserCommand = Object.values(commandCountMap).sort((a, b) => b.count - a.count)[0];

    // جمع معرفات المستخدمين بدون تكرار
    const userIds = [...new Set(allLogs.map(log => log.userid))];

    // جلب بيانات المستخدمين من Twitch دفعة واحدة (حتى 100 لكل طلب)
    const chunkSize = 100;
    const userProfiles = {};
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const twitchUsersResponse = await axios.get(
        `https://api.twitch.tv/helix/users`,
        {
          params: { id: chunk },
          headers: {
            "Client-ID": TWITCH_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      for (const user of twitchUsersResponse.data.data) {
        userProfiles[user.id] = user;
      }
    }

    // بناء الخريطة مع صور البروفايل وعدد الرسائل
    const countMap = {};
    for (const log of allLogs) {
      const twitchUser = userProfiles[log.userid];
      const key = `${log.userid}::${log.username}`;
      if (!countMap[key]) {
        countMap[key] = {
          username: log.username,
          message_count: 0,
          profile_image: twitchUser ? twitchUser.profile_image_url : null,
        };
      }
      countMap[key].message_count++;
    }

    // ترتيب المستخدمين حسب التفاعل وأخذ أول 5
    const logsArray = Object.values(countMap)
      .sort((a, b) => b.message_count - a.message_count)
      .slice(0, 5);

    // إرسال الرد
    res.status(200).json({
      logs: logsArray,
      top1InChat: [topUserCommand, topUserMessage].filter(Boolean),
    });
  } catch (error) {
    console.error("Error in getTopChat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMessageLogs = async (req, res) => {
  const channelId = req.user.id;
  const { type } = req.query;

  try {
    const repo = AppDataSource.getRepository(BotLogs);

 
   const logs = await repo.find({
      where: { channelId,typeid:Number(type) },
      order: { logTimestamp: "DESC" }, 
      take: 10000,

    });


    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching message logs:", error);
    res.status(500).send("Error fetching message logs");
  }
};
async function getLogs2(req, res) {
  try {
    const channelId = req.user.id;
    let { from_date, to_date, page = 1, pageSize = 10 } = req.query;

    const take = parseInt(pageSize, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const repo = AppDataSource.getRepository(BotLogsView);

    let whereClause = { channelId };

    // إذا تم تحديد from_date و to_date بشكل صحيح وغير "all" أضف شرط Between
    if (from_date && from_date !== "all" && to_date && to_date !== "all") {
      const fromDateObj = new Date(from_date);
      const toDateObj = new Date(to_date);
      toDateObj.setHours(23, 59, 59, 999); // Include full day
      whereClause = {
        ...whereClause,
        logTimestamp: Between(fromDateObj, toDateObj),
      };
    }

    // الحصول على العدد الكلي
    const totalCount = await repo.count({
      where: whereClause,
    });

    // جلب الـ logs مع pagination
    const logs = await repo.find({
      where: whereClause,
      order: { logTimestamp: "DESC" },
      skip,
      take,
    });

    res.status(200).json({ logs, totalCount });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).send("Error fetching logs");
  }
}

async function getLogs(req, res) {
  try {
    const channelId = req.user.id;

    const repo = AppDataSource.getRepository(BotLogsView);


    const logs = await repo.find({
      where: { channelId },
      order: { logTimestamp: "DESC" }, 
      take: 10000,                      
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).send("Error fetching logs");
  }
}



const getChat = async (req, res) => {
  try {
    const channelId = req.user.id;
    const accessToken = await fetchToken(channelId);
    const repo = AppDataSource.getRepository(TwitchMessages);

    
    // الكلمات الممنوعة
    const spamKeywords = ['huierp.xyz', 'niren88.com', 'qqzy'];

    // 1. Fetch all messages for the given channel
    const allMessages = await repo.find({
      where: { channelId },
    });
    // 2. Identify spam users
    const spamUsers = new Set();
    for (const msg of allMessages) {
      const lowerMsg = msg.messageText?.toLowerCase() || "";
      if (spamKeywords.some((kw) => lowerMsg.includes(kw))) {
        spamUsers.add(msg.userId);
      }
    }

    // 3. Count messages per user excluding spam users
    const userMessageMap = new Map();
    for (const msg of allMessages) {
      if (spamUsers.has(msg.userId)) continue;

      if (!userMessageMap.has(msg.userId)) {
        userMessageMap.set(msg.userId, {
          user_id: msg.userId,
          username: msg.displayName,
          color:msg.color,
          message_count: 1,
        });
      } else {
        userMessageMap.get(msg.userId).message_count++;
      }
    }

    // 4. Convert to array and sort by message_count descending
    const sortedUsers = Array.from(userMessageMap.values()).sort(
      (a, b) => b.message_count - a.message_count
    );

    // 5. Prepare batches to fetch Twitch user profiles
    const userIds = sortedUsers.map((user) => user.user_id);
    const BATCH_SIZE = 100;
    const userBatches = [];
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      userBatches.push(userIds.slice(i, i + BATCH_SIZE));
    }

    let twitchUsersData = [];
    for (const batch of userBatches) {
      const params = new URLSearchParams();
      batch.forEach((id) => params.append("id", id));

      const response = await axios.get(
        `https://api.twitch.tv/helix/users?${params.toString()}`,
        {
          headers: {
            "Client-ID": TWITCH_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      twitchUsersData = twitchUsersData.concat(response.data.data);
    }

    // 6. Format final result with profile image
    const formattedResults = sortedUsers.map((user) => {
      const twitchUser = twitchUsersData.find(
        (u) => u.id === user.user_id?.toString()
      );
     
      return {
        ...user,
        profile_image_url: twitchUser?.profile_image_url || null,
      };
    });

      
    res.status(200).json({ users: formattedResults });
  } catch (error) {
    console.error("Error fetching users:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};
const getUserMessages = async (req,res) => {
      const channelId = req.user.id;
    const { userId } = req.query;
  try{
  const repo = AppDataSource.getRepository(TwitchMessages);

  const messages = await repo.find({
    where: {
      channelId: channelId,
      userId: userId,
    },
    order: {
      messageDate: "DESC",
    },
  });
        res.status(200).json({
      message: messages,
    });
}
  catch (error) {
    console.error("Error fetching message logs:", error);
    res.status(500).send("Error fetching message logs");
  }
};
const getTwitchData = async (accessToken, endpoint, params = {}) => {
  try {
    const response = await axios.get(`${endpoint}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}`, error);
    return null;
  }
};
const dashboardTotalsHandler = async (req, res) => {
  try {
    const channelId = req.user.id;
    const accessToken = await fetchToken(channelId);

    // جلب بيانات Twitch API
    const followersData = await getTwitchData(
      accessToken,
      "https://api.twitch.tv/helix/channels/followers",
      { broadcaster_id: channelId }
    );
    const followersCount = followersData.total;

    const subscriptionsData = await getTwitchData(
      accessToken,
      "https://api.twitch.tv/helix/subscriptions",
      { broadcaster_id: channelId }
    );
    const subscriptionsCount = subscriptionsData.data.length;

    const leaderboardData = await getTwitchData(
      accessToken,
      "https://api.twitch.tv/helix/bits/leaderboard"
    );
    const totalBits = leaderboardData.data.reduce(
      (sum, entry) => sum + entry.score,
      0
    );

    // العد باستخدام TypeORM
    const repo = AppDataSource.getRepository(BotLogs);

    const totalCountCommand = await repo.count({
      where: {
        typeid: 8,
        channelId: channelId,
      },
    });

    const totalCountMessage = await repo.count({
      where: {
        typeid: 5,
        channelId: channelId,
      },
    });

    res.status(200).json({
      followers: followersCount,
      subscriptions: subscriptionsCount,
      totalBits,
      totalCountMessage,
      totalCountCommand,
    });
  } catch (error) {
    console.error("Error fetching dashboard totals:", error);
    res.status(500).send("Internal Server Error");
  }
};
const getBitsLeaderboardHandler = async (req, res) => {
  try {
    const channelId = req.user.id;
    let count = parseInt(req.query.count, 10);

    if (isNaN(count) || count < 1) count = 100;
    else if (count > 100) count = 100;

    const accessToken = await fetchToken(channelId);

    const response = await axios.get(
      "https://api.twitch.tv/helix/bits/leaderboard",
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          count,
          period: "all",
        },
      }
    );

    res.status(200).json(response.data.data);
  } catch (error) {
    console.error("Error fetching Bits leaderboard:", error);
    res.status(500).send("Error fetching Bits leaderboard");
  }
};
async function getUserInfo(accessToken, userId) {
  try {
    const response = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        id: userId,
      },
    });
    return response.data.data[0];
  } catch (error) {
    console.error(`Error fetching user info for ${userId}:`, error);
    return null;
  }
}
const subscriptionsHandler = async (req, res) => {
  try {
    const channelId = req.user.id;
    const accessToken = await fetchToken(channelId);
    const { cursor } = req.query;

    const response = await axios.get(
      "https://api.twitch.tv/helix/subscriptions",
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          broadcaster_id: channelId,
          after: cursor,
        },
      }
    );

    const subscriptions = response.data.data;
    const nextCursor = response.data.pagination?.cursor;

    const detailedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        const user = await getUserInfo(accessToken, sub.user_id);
        return {
          ...sub,
          user: user
            ? {
                displayName: user.display_name,
                profileImageUrl: user.profile_image_url,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      subscriptions: detailedSubscriptions,
      cursor: nextCursor,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const eventsHandler = async (req, res) => {
  try {
    const broadcasterId = req.user.id;
    const repo = AppDataSource.getRepository(TwitchActivity);

    const events = await repo.find({
      where: { broadcasterId },
      relations: ["type"],
      order: { createdAt: "DESC" },
    });

    if (events.length === 0) {
      return res.status(404).send("User not found");
    }

    const formattedResults = events.map((a) => ({
      ActivityId: a.ActivityId,
      broadcasterid: a.broadcasterId,
      broadcasterusername: a.broadcasterUsername,
      moderatorid: a.moderatorId,
      moderatorusername: a.moderatorUsername,
      userid: a.userId,
      username: a.username,
      reason: a.reason,
      event_time: a.eventTime,
      label: a.type?.label,
      counts: a.counts,
      color: a.type?.color,
      description: a.type?.description,
      created_at: a.createdAt,
      avatar: a.avatar,
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching user profile");
  }
};
const getClips = async (req, res) => {
  try {
    const channelId = req.user.id;
    const accessToken = await fetchToken(channelId);
    const { broadcaster_id } = req.query;

    if (!broadcaster_id) {
      return res.status(400).json({ error: "broadcaster_id is required." });
    }

    let after = null;
    let allClips = [];

    do {
      const response = await axios.get("https://api.twitch.tv/helix/clips", {
        params: {
          broadcaster_id: broadcaster_id,
          first: 100,
          after: after,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": TWITCH_CLIENT_ID,
        },
      });

      let { data, pagination } = response.data;

      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      allClips = allClips.concat(data);

      after = pagination ? pagination.cursor : null;
    } while (after);

    res.status(200).json({ data: allClips });
  } catch (error) {
    console.error(
      "Error fetching clips:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch clips." });
  }
};

const addBotAsModerator = async (req, res) => {
  const broadcasterId = req.user.id;
  const userIdToMod = process.env.TWITCH_BOTID;
  const ClientId  = process.env.TWITCH_CLIENT_ID
  try {
    const accessToken = await fetchToken(broadcasterId); // دالة تحصل التوكن
    const authProvider = new StaticAuthProvider(ClientId, accessToken);
    const apiClient = new ApiClient({ authProvider });

    try {
      await apiClient.moderation.addModerator(broadcasterId, userIdToMod);
      return res.status(200).json({ success: true });
    } catch (modError) {
      if (
        modError.statusCode === 400 &&
        modError.message?.includes("user is already a mod")
      ) {
        return res.status(200).json({ success: true });
      }

      // أي خطأ غير متوقع نرميه
      throw modError;
    }
  } catch (error) {
    console.error("خطأ أثناء محاولة تعيين المود:", error);
    return res.status(500).json({ error: error.message || "حدث خطأ غير متوقع" });
  }
};
const firstJoin = async (req, res) => {
  const channelId = req.user.id; // نفترض أن الـ user موجود في req

  try {
    const repo = AppDataSource.getRepository(UserChannels);

    // تحديث الـ record الخاص بالبث أو المستخدم
    const updateResult = await repo.update(
      { channelId }, // شرط التحديث
      { isFirstJoin: 1 } // القيمة الجديدة
    );

    if (updateResult.affected > 0) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ success: false, message: "لم يتم العثور على المستخدم" });
    }
  } catch (error) {
    console.error("خطأ أثناء محاولة تعيين isFirstJoin:", error);
    return res.status(500).json({ error: error.message || "حدث خطأ غير متوقع" });
  }
};
const verifyToken = (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ valid: true, payload: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
};

const validateRes = async (req, res) => {
  const { token } = req.body;

  try {
    const validateRes = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: { Authorization: `OAuth ${token}` },
    });

    const data = validateRes.data;

    // رجّع فقط البيانات اللي تحتاجها
    res.status(200).json({
      user_id: data.user_id,
      login: data.login,
      scopes: data.scopes || [],
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
const refreshTwitchToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).send("Refresh token is required");
  }

  try {
    // 1) اطلب Access Token جديد من Twitch
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          refresh_token,
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
        },
      }
    );

    const { access_token, refresh_token: new_refresh_token } = response.data;

    console.log("🟢 New Access Token:", access_token);
    console.log("🔄 New Refresh Token:", new_refresh_token);

    // 2) جيب بيانات المستخدم
    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    const channelData = userResponse.data.data[0];
    channelData.access_token = access_token;
    channelData.refresh_token = new_refresh_token || refresh_token;

    // 3) خزّن البيانات بقاعدة البيانات
    await CreateOrUpdateChannel(channelData);

    // 4) أنشئ JWT
    const token = jwt.sign(
      {
        id: channelData.id,
        login: channelData.login,
        access_token: channelData.access_token,
        refresh_token: channelData.refresh_token,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
      access_token: channelData.access_token,
      refresh_token: channelData.refresh_token,
    });
  } catch (error) {
    console.error(
      "❌ Failed to refresh token:",
      error.response?.data || error.message
    );
    res.status(500).send("Error refreshing token");
  }
};

async function updateUserStreak(user_id, user_name, channel_id, stream_date) {
  try {
    if (!stream_date) throw new Error('stream_date is missing or invalid');

    const dateObj = new Date(stream_date);
    if (isNaN(dateObj.getTime())) throw new Error('stream_date is not a valid date');

    const formattedDate = dateObj.toISOString().split('T')[0];

    await AppDataSource.query(
      `BEGIN update_user_streak(:user_id, :user_name, :channel_id, TO_DATE(:stream_date, 'YYYY-MM-DD')); END;`,
      [user_id, user_name, channel_id, formattedDate]
    );

    console.log(`✅ تم تحديث الستريك لـ ${user_id}`);
  } catch (err) {
    console.error(`❌ خطأ أثناء تحديث الستريك لـ ${user_id}:`, err.message);
  }
}

const getStreakUser = async (req, res) => {
  const { channelName } = req.params;

  if (!channelName) {
    return res.status(400).send("channelName is required");
  }

  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const user = await repo.findOneBy({ nameLogin: channelName });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const repoStreak = AppDataSource.getRepository(TwitchStreaksView);
    const streaks = await repoStreak.find({
      where: { channelId: user.channelId },
    });

    return res.status(200).json(streaks);
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return res.status(503).send("Internal server error");
  }
};
const getUser_Summary = async (req, res) => {
  const { channelName } = req.params;

  if (!channelName) {
    return res.status(400).send("channelName is required");
  }

  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const user = await repo.findOneBy({ nameLogin: channelName });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const repoStreak = AppDataSource.getRepository(VwUserSummary);
   
    
    const streaks = await repoStreak.find({
      where: { channelId: user.channelId },
    });
    return res.status(200).json(streaks);
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return res.status(503).send("Internal server error");
  }
};
module.exports ={getMenu,firstJoin,getStreakUser,getUser_Summary,getNotifications,getTwitchUser,refreshTwitchToken,updateUserStreak,getUserColor,stream_Day,getWeeklyActivity,getTopChat,markNotificationsAsSeen,getChannelStatus,addBotAsModerator,verifyToken,validateRes,saveNotification,
  getMessageLogs,getChat,getUserMessages,dashboardTotalsHandler,getBitsLeaderboardHandler,subscriptionsHandler,eventsHandler ,getClips,getLogs,getNotificationsCount};