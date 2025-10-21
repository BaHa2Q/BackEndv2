const { MoreThan, MoreThanOrEqual, Between } = require("typeorm");
const { AppDataSource } = require("../data-source");
const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {
  RecaptchaEnterpriseServiceClient,
} = require("@google-cloud/recaptcha-enterprise");

const { fetchToken } = require("../utils/Token");
const { MenuItems } = require("../entities/MenuItemsModel");
const { NotificationStream } = require("../entities/NotificationStreamModel");
const { VwWeeklyActivity } = require("../entities/VwWeeklyActivityModel");
const { BotLogs } = require("../entities/BotLogsModel");
const { Messages } = require("../entities/MessagesModel");
const { BotLogsView } = require("../entities/BotLogsViewModel");
const { UserChannels } = require("../entities/UserChannelsModel");
const { UserSetting } = require("../entities/UserSettingModel");
const { StreamDays } = require("../entities/StreamDaysModel");
const { VwUserSummary } = require("../entities/VwUserSummary");
const { v4: uuidv4 } = require("uuid");

const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { TwitchActivity } = require("../entities/TwitchActivityModel");
const { CreateOrUpdateChannel } = require("./CreateChannel");
const { ViewFavoriteUsers } = require("../entities/ViewFavoriteUsersModel");
const { isUserLive, isUserLiveKick } = require("./ProfileController");
const { UserFavorite } = require("../entities/UserFavoriteModel");
const { subscribeToChannel } = require("../routes/twitchWebhookRoute");
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
require("dotenv").config(); // Load environment variables from .env file
const getMenu = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(MenuItems);
    const { platformId } = req.user;

    let whereCondition = { active: 1 };

    // إذا المنصة رقم 2 فقط، فلتر حسبها
    if (platformId === 2) {
      whereCondition.platformId = 2;
    }

    const menu = await repo.find({
      where: whereCondition,
      order: { levels: "ASC" } // 🔥 الترتيب حسب levels تصاعدي
    });

    res.status(200).json(menu);
  } catch (err) {
    console.error("Error retrieving command data:", err);
    res.status(500).send("An error occurred while retrieving command data");
  }
};


const getNotifications = async (req, res) => {
  const channelId = req.user.id;
const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    const events = await repo.find({
      where: { userId: channelId,platformId },
      order: { startedAt: "DESC" },
    });

    const unseenCount = events.filter((e) => e.isSeen === 0).length;

    res.status(200).json({
      notifications: events,
      unseenCount,
    });
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الإشعارات:", err.message);
    res.status(500).json({ error: "فشل جلب الإشعارات" });
  }
};
const updateNotifications = async (req, res) => {
  const { id } = req.params;               // الـ ID جاي من الباراميتر
  const { notifications } = req.body;      // القيمة الجديدة جاي من الـ body
       
    await subscribeToChannel(channelData.id)
  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    // التأكد من وجود السجل
    const favorite = await repo.findOneBy({ id });
    if (!favorite) {
      return res.status(404).json({ error: "السجل غير موجود" });
    }

    // تحديث العمود
    favorite.notifications = notifications;

    // حفظ التعديلات
    await repo.save(favorite);

    return res.status(200).json({
      message: "✅ تم تحديث الإشعارات بنجاح",
      notifications: favorite.notifications,
    });
  } catch (err) {
    console.error("❌ خطأ أثناء تحديث الإشعارات:", err.message);
    return res.status(500).json({ error: "فشل تحديث الإشعارات" });
  }
};
const getNotificationsCount = async (req, res) => {
  const channelId = req.user.id;
  const {platformId} = req.user
  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  try {
    // 🔹 عدّ الإشعارات الغير مقروءة
    const notificationRepo = AppDataSource.getRepository(NotificationStream);
    const unseenCount = await notificationRepo.count({
      where: { userId: channelId, isSeen: 0,platformId },
    });

    // 🔹 عدّ المفضلين اللي لايف
    const {accessToken,refreshToken,data} = await fetchToken(channelId);
    const favoritesRepo = AppDataSource.getRepository(ViewFavoriteUsers);

    let favorites = await favoritesRepo.find({
      where: { channelId: channelId,platformId },
    });

    let liveCount = 0;
    let liveStatus;
    for (const user of favorites) {     

        if (platformId === 2) {
           liveStatus = await isUserLiveKick(user.userId, accessToken,refreshToken,data);
        }else{
           liveStatus = await isUserLive(user.userId, accessToken);
        }
      if (liveStatus?.isLive) {
        liveCount++;
      }
    }
    
    
    // 🔹 رجع النتيجة
    res.status(200).json({ unseenCount, liveCount });
  } catch (err) {
    res.status(500).json({ error: "فشل في عدّ الإشعارات" });
  }
};

const markNotificationsAsSeen = async (req, res) => {
  const channelId = req.user.id;

  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    await repo.update({ userId: channelId, isSeen: 0 }, { isSeen: 1 });

    res.status(200).json({ message: "تم تحديد الإشعارات كمقروءة." });
  } catch (err) {
    console.error("❌ خطأ أثناء تحديث الإشعارات:", err.message);
    res.status(500).json({ error: "فشل تحديث الإشعارات" });
  }
};
const getChannelStatus = async (req, res) => {
  const channelId = req.user.id;
  const { active } = req.body; // ممكن يكون undefined لو ما أرسل
  const {platformId} = req.user;

  try {
    const channelsRepo = AppDataSource.getRepository(UserChannels);
    const settingsRepo = AppDataSource.getRepository(UserSetting);

    // جلب القناة
    const channel = await channelsRepo.findOne({ where: { channelId,platformId } });
    if (!channel) return res.status(404).json({ exists: false });

    // تحديث التواريخ لو غير موجود firstJoin و آخر زيارة دائماً
    const now = new Date();
    if (!channel.firstJoin) {
      channel.firstJoin = now;
    }
    channel.lastJoin = now;
    await channelsRepo.save(channel);

    // جلب أو إنشاء إعدادات القناة
    let settings = await settingsRepo.findOne({ where: { userId: channelId ,platformId} });
    if (!settings) {
      settings = settingsRepo.create({ userId: channelId, isBotActive: 0,platformId });
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

async function getTwitchUser(req, res) {
  const { user_id } = req.query;
  const channelId = req.user.id;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const {accessToken} = await fetchToken(channelId);

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
const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(VwWeeklyActivity);

    const events = await repo.find({
      where: { channelId: channelId,platformId },
      order: { logDate: "ASC" },
    });

    if (!events || events.length === 0) {
      return res.status(200).json({
        daily: [],
        totals: {
          date_from: null,
          date_to: null,
          total_message_count: 0,
          total_command_count: 0,
        },
      });
    }

    // daily data (strip extra fields)
    const daily = events.map((e) => ({
      log_date: e.logDate,
      day: e.day,
      message_count: e.messageCount,
      command_count: e.commandCount,
    }));

    // take totals from first row (they’re the same in all rows)
    const first = events[0];
    const totals = {
      date_from: first.dateFrom,
      date_to: first.dateTo,
      total_message_count: first.totalMessageCount,
      total_command_count: first.totalCommandCount,
    };

    res.status(200).json({ daily, totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTopChat = async (req, res) => {
  const channelId = req.user.id;
  const { platformId } = req.user;
  const { type, day } = req.body;

  const maxDay = 30;
  const safeDay = Math.min(day || 1, maxDay);

  const { accessToken } = await fetchToken(channelId);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - safeDay);

  try {
    const repo = AppDataSource.getRepository(BotLogs);

    const allLogs = await repo.find({
      where: {
        typeid: type,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
        platformId
      },
    });

    const messageLogs = await repo.find({
      where: {
        typeid: 5,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
        platformId
      },
    });

    const commandLogs = await repo.find({
      where: {
        typeid: 10,
        channelId: channelId,
        isbot: 0,
        logTimestamp: MoreThanOrEqual(startDate),
        platformId
      },
    });

    // حساب أكثر مستخدمين نشاطًا في الرسائل والأوامر
    const messageCountMap = {};
    for (const log of messageLogs) {
      const key = `${log.userid}::${log.username}`;
      if (!messageCountMap[key]) messageCountMap[key] = { user_id: log.userid, username: log.username, count: 0, type: "message_count" };
      messageCountMap[key].count++;
    }
    const topUserMessage = Object.values(messageCountMap).sort((a,b)=>b.count - a.count)[0];

    const commandCountMap = {};
    for (const log of commandLogs) {
      const key = `${log.userid}::${log.username}`;
      if (!commandCountMap[key]) commandCountMap[key] = { user_id: log.userid, username: log.username, count: 0, type: "command_count" };
      commandCountMap[key].count++;
    }
    const topUserCommand = Object.values(commandCountMap).sort((a,b)=>b.count - a.count)[0];

    // جمع معرفات المستخدمين بدون تكرار
    const userIds = [...new Set(allLogs.map(log => log.userid))];
    const userProfiles = {};

    if(platformId === 1) {
      // Twitch
      const chunkSize = 100;
      for(let i=0; i<userIds.length; i+=chunkSize){
        const chunk = userIds.slice(i, i+chunkSize);
        const twitchUsersResponse = await axios.get(`https://api.twitch.tv/helix/users`, {
          params: { id: chunk },
          headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${accessToken}` }
        });
        for(const user of twitchUsersResponse.data.data) userProfiles[user.id] = user;
      }
    } else if(platformId === 2) {
      // Kick
      for(const userId of userIds){
        try {
          const response = await axios.get(`https://api.kick.com/private/v1/users/${userId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          userProfiles[userId] = response.data?.data?.account?.user || null;
        } catch(err){
          userProfiles[userId] = null;
        }
      }
    }

    // بناء الخريطة مع الصور وعدد الرسائل
    const countMap = {};
    for(const log of allLogs){
      const userData = userProfiles[log.userid];
      const key = `${log.userid}::${log.username}`;
      if(!countMap[key]) countMap[key] = {
        username: log.username,
        message_count: 0,
        profile_image: userData ? (platformId === 1 ? userData.profile_image_url : userData.profile_picture) : null
      };
      countMap[key].message_count++;
    }

    const logsArray = Object.values(countMap).sort((a,b)=>b.message_count - a.message_count).slice(0,5);

    res.status(200).json({
      logs: logsArray,
      top1InChat: [topUserCommand, topUserMessage].filter(Boolean)
    });

  } catch(error){
    console.error("Error in getTopChat:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


const getMessageLogs = async (req, res) => {
  const channelId = req.user.id;
  const { type } = req.query;
const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(BotLogs);

    const logs = await repo.find({
      where: { channelId, typeid: Number(type),platformId },
      order: { logTimestamp: "DESC" },
      take: 10000,
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching message logs:", error);
    res.status(500).send("Error fetching message logs");
  }
};


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
    const {accessToken} = await fetchToken(channelId);
    const repo = AppDataSource.getRepository(Messages);
const {platformId} = req.user;
    // الكلمات الممنوعة
    const spamKeywords = ["huierp.xyz", "niren88.com", "qqzy"];

    // 1. Fetch all messages for the given channel
    const allMessages = await repo.find({
      where: { channelId,platformId },
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
          color: msg.color,
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
        (u) => u.id === user.user_id?.toString(),platformId
      );

      return {
        ...user,
        profile_image_url: twitchUser?.profile_image_url || null,
      };
    });

    res.status(200).json({ users: formattedResults });
  } catch (error) {
    console.error(
      "Error fetching users:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch users." });
  }
};
const getUserMessages = async (req, res) => {
  const channelId = req.user.id;
  const { userId } = req.query;
  const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(Messages);

    const messages = await repo.find({
      where: {
        channelId: channelId,
        userId: userId,platformId
      },
      order: {
        messageDate: "DESC",
      },
    });
    res.status(200).json({
      message: messages,
    });
  } catch (error) {
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
   const {accessToken} = await fetchToken(channelId);

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

    
    const filteredSubscriptions = subscriptionsData.data.filter(
      (sub) => sub.user_id !== channelId
    ).length;

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
      subscriptions: filteredSubscriptions,
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

    const {accessToken} = await fetchToken(channelId);;

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
    const { accessToken } = await fetchToken(channelId);
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

    // ✅ تصفية subscriptions بحيث لا يظهر channelId
    const filteredSubs = subscriptions.filter(sub => sub.user_id !== channelId);

    const nextCursor = response.data.pagination?.cursor;

    const detailedSubscriptions = await Promise.all(
      filteredSubs.map(async (sub) => {
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
   const channelId = req.user.id;
   const {platformId} = req.user;
    const repo = AppDataSource.getRepository(TwitchActivity);

    const events = await repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.type", "t")
      .where("a.broadcasterId = :channelId", { channelId })
      .andWhere("a.platformId = :platformId", { platformId })
      .select([
        "a", // كل أعمدة TWITCH_ACTIVITY
        "t.id",
        "t.label",
        "t.color",
        "t.description",
      ])
      .orderBy("a.createdAt", "DESC")
      .getMany();

      
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
      note: a.note,
      displayName: a.displayName,
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
    const {accessToken} = await fetchToken(channelId);
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
const getUser_Summary = async (req, res) => {
  const { channelName } = req.params;
const {platformId} = req.user;
  if (!channelName) {
    return res.status(400).send("channelName is required");
  }

  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const user = await repo.findOneBy({ nameLogin: channelName,platformId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const repoStreak = AppDataSource.getRepository(VwUserSummary);

    const leaderboard = await repoStreak.find({
      where: { channelId: user.channelId ,platformId},
    });
    
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(503).send("Internal server error");
  }
};
const addBotAsModerator = async (req, res) => {
 const channelId = req.user.id;
  const userIdToMod = process.env.TWITCH_BOTID;
  try {
    const {accessToken} = await fetchToken(channelId);// دالة تحصل التوكن
    const authProvider = new StaticAuthProvider(TWITCH_CLIENT_ID, accessToken);
    const apiClient = new ApiClient({ authProvider });

    try {
      await apiClient.moderation.addModerator(broadcasterId = channelId, userIdToMod);

      // هنا ترجع رسالة واضحة
      return res.status(200).json({
        success: true,
        message: "done",
      });
    } catch (modError) {
      if (
        modError.statusCode === 400 &&
        modError.message?.includes("user is already a mod")
      ) {
        return res.status(200).json({
          success: true,
          message: "done",
        });
      }

      // أي خطأ غير متوقع نرميه
      throw modError;
    }
  } catch (error) {
    console.error("خطأ أثناء محاولة تعيين المود:", error);
    return res.status(500).json({
      success: false,
      message: "❌ حدث خطأ أثناء إعطاء صلاحية Moderator للبوت.",
      error: error.message || error,
    });
  }
};

const firstJoin = async (req, res) => {
  const channelId = req.user.id; 

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
      return res
        .status(404)
        .json({ success: false, message: "لم يتم العثور على المستخدم" });
    }
  } catch (error) {
    console.error("خطأ أثناء محاولة تعيين isFirstJoin:", error);
    return res
      .status(500)
      .json({ error: error.message || "حدث خطأ غير متوقع" });
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
    const validateRes = await axios.get(
      "https://id.twitch.tv/oauth2/validate",
      {
        headers: { Authorization: `OAuth ${token}` },
      }
    );

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

const searchTwitchUser = async (req, res) => {
  const { name } = req.query;
  const ClientId = process.env.TWITCH_CLIENT_ID;
  const channelId = req.user.id;
  const { accessToken } = await fetchToken(channelId);
  const authProvider = new StaticAuthProvider(ClientId, accessToken);
  const apiClient = new ApiClient({ authProvider });

  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    // البحث عن القنوات
    const results = await apiClient.search.searchChannels(name);

    // IDs لكل المستخدمين
    const userIds = results.data.map((ch) => ch.id);

    // جلب تفاصيل المستخدمين
    const usersInfo = await apiClient.users.getUsersByIds(userIds);

    // دمج البيانات
    const users = results.data.map((user) => {
      const fullUser = usersInfo.find((u) => u.id === user.id);
      return {
        id: user.id,
        name: user.displayName,
        login: user.name,
        avatar: user.thumbnailUrl,
        broadcasterType: fullUser?.broadcasterType || "none", // الآن يظهر النوع الصحيح
        isLive: user.isLive,
        title: user.title,
      };
    });

    res.json(users);
  } catch (err) {
    console.error("❌ Twitch API Error:", err);
    res.status(500).json({ error: "Twitch API error" });
  }
};


// إعداد transporter

// التحقق من reCAPTCHA
const verifyRecaptcha = async (token) => {
  const secretKey = "6LdH6tIrAAAAAHo-dWuRvIMh7__J0ZotOdVmlq3E";
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();

    // لوق كامل للـ response من Google
    console.log("reCAPTCHA verification response:", data);

    return data.success;
  } catch (err) {
    console.error("Error verifying reCAPTCHA:", err);
    return false;
  }
};
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com", // أو mail.yallabots.com حسب الـ DNS
  port: 465, // أو 465
  secure: true, // true للـ 465، false للـ 587
  auth: {
    user: "support@yallabots.com",
    pass: "Apex@123#",
  },
  tls: { rejectUnauthorized: false }, // مهم للـ TLS على localhost
});

// مسار POST لإرسال الإيميل
const sendEmail = async (req, res) => {
  const { firstName, lastName, email, subject, message, recaptchaToken } =
    req.body;

  // تحقق من reCAPTCHA
  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    return res
      .status(400)
      .json({ success: false, message: "reCAPTCHA verification failed" });
  }

  // إعداد mailOptions
  const mailOptions = {
    from: `"YallaBots Support" <support@yallabots.com>`,
    to: "support@yallabots.com",
    subject: subject || "New Contact Form Submission",
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email Address:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!", info });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send email", error });
  }
};

module.exports = {
  getMenu,
  sendEmail,
  searchTwitchUser,
  getUser_Summary,
  firstJoin,
  getNotifications,
  updateNotifications,
  getTwitchUser,
  refreshTwitchToken,
  getWeeklyActivity,
  getTopChat,
  markNotificationsAsSeen,
  getChannelStatus,
  addBotAsModerator,
  verifyToken,
  validateRes,
  getMessageLogs,
  getChat,
  getUserMessages,
  dashboardTotalsHandler,
  getBitsLeaderboardHandler,
  subscriptionsHandler,
  eventsHandler,
  getClips,
  getLogs,
  getNotificationsCount,
};
