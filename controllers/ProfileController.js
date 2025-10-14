const { AppDataSource } = require("../data-source");
const axios = require("axios");
const { UserChannels } = require("../entities/UserChannelsModel");
const { UserFavorite } = require("../entities/UserFavoriteModel");
const { UserSetting } = require("../entities/UserSettingModel");
const { ViewFavoriteUsers } = require("../entities/ViewFavoriteUsersModel");
const { v4: uuidv4 } = require("uuid");
const { TwitchActivity } = require("../entities/TwitchActivityModel");
const { fetchToken } = require("../utils/Token");
const { VwAllUserTokensInfo } = require("../entities/VwAllUserTokensInfoModel");
const { refreshKickToken, refreshKickAccessToken } = require("./refreshKickToken");

const favoriteCache = new Map(); // المفتاح: channelId ، القيمة: Set من broadcasterIds

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.user;
    const repo = AppDataSource.getRepository(VwAllUserTokensInfo);
    const user = await repo.findOneBy({ channelId: userId, platformId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // محاولة جلب لون الشات
    let color = null;
    try {
      const { accessToken } = await fetchToken(userId);
      const colorResponse = await axios.get(
        "https://api.twitch.tv/helix/chat/color",
        {
          params: { user_id: userId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": process.env.TWITCH_CLIENT_ID,
          },
        }
      );
      color = colorResponse.data?.data?.[0]?.color || null;
    } catch (colorError) {}

    // إرسال البيانات
    res.status(200).json({
      id: user.channelId,
      login: user.nameLogin,
      display_name: user.displayName,
      profile_image_url: user.profileImageUrl,
      email: user.email,
      isSubscribed: user.isSubscribed,
      color: color || "#fff",
      language: user.language,
      isFirstJoin: user.isFirstJoin,
    });
  } catch (error) {
    console.error("Error fetching user profile", error.response?.data || error.message);
    res.status(500).send("Error fetching user profile");
  }
};

const getAllUserProfiles = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const users = await repo.find();

    const profiles = users.map((user) => ({
      id: user.channelId,
      login: user.nameLogin,
      display_name: user.displayName,
      profile_image_url: user.profileImageUrl,
    }));

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error.response?.data || error.message);
    res.status(500).send("Error fetching profiles");
  }
};

const getChannelStatus = async (req, res) => {
  const channelId = req.user.id;
  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const UserChannel = await repo.findOneBy({ channelId: channelId });

    if (!UserChannel) {
      return res.status(200).json({ exists: false });
    }

    const shouldShowModal = UserChannel.firstJoin === null;
    const isActive = UserChannel.isjoin === 1;

    res.status(200).json({
      exists: true,
      showModal: shouldShowModal,
      active: isActive,
    });
  } catch (error) {
    console.error("Error fetching channel status:", error.response?.data || error.message);
    res.status(500).send("An error occurred while fetching channel status");
  }
};

const updateUserLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const channelId = req.user.id;

    if (!channelId || !language) {
      return res.status(400).json({ error: "channelId and language are required" });
    }

    // تحقق من صحة اللغة
    if (!["en", "ar"].includes(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }

    const repo = AppDataSource.getRepository(UserChannels);
    let userChannel = await repo.findOne({ where: { channelId } });

    if (!userChannel) {
      // إنشاء جديد لو ما موجود
      userChannel = repo.create({ channelId, language });
    } else {
      // تحديث اللغة لو موجود
      userChannel.language = language;
    }

    await repo.save(userChannel);
    return res.status(200).json({ message: "Language updated successfully" });
  } catch (error) {
    console.error("error Language updated successfully", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
};
async function isUserLive(userId, accessToken, platformId) {
  try {
    if (platformId === 2) {
      // ================= Kick =================
      const response = await axios.get(
        `https://api.kick.com/public/v1/livestreams`,
        {
          params: { broadcaster_user_id: userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const streamData = response.data.data;
      if (streamData.length > 0) {
        const startedAt = new Date(streamData[0].started_at);
        const now = new Date();
        const diffMs = now - startedAt;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return {
          isLive: true,
          title: streamData[0].title,
          view: streamData[0].viewer_count || 0,
          startedAt: streamData[0].started_at,
          duration: `${hours}h ${minutes}m ${seconds}s`,
        };
      }
      return { isLive: false, view: 0, startedAt: null, duration: null };
    } else {
      // ================= Twitch =================
      const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_id=${userId}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const streamData = response.data.data;
      if (streamData.length > 0) {
        const startedAt = new Date(streamData[0].started_at);
        const now = new Date();
        const diffMs = now - startedAt;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return {
          isLive: true,
          title: streamData[0].title,
          view: streamData[0].viewer_count || 0,
          startedAt: streamData[0].started_at,
          duration: `${hours}h ${minutes}m ${seconds}s`,
        };
      }

      return { isLive: false, view: 0, startedAt: null, duration: null };
    }
  } catch (error) {
    console.warn("Error fetching live status Twitch:", error.response?.data || error.message);
    return { isLive: false, view: 0, startedAt: null, duration: null };
  }
}

async function getChannelInfo(req, res) {
  const login = req.query.login;
  const { platformId } = req.user;

  if (!login) return res.status(400).send("Login is required");

  let userDetailsRaw;
  let color = null;
  let totalFollowers = null;
  let channelInfo = null;
  let liveStatus = null;
  let userId = null;

  try {
    const channelId = req.user.id;
    const { accessToken } = await fetchToken(channelId);

    if (platformId === 2) {
      const userDetailResponseKick = await axios.get(
        "https://api.kick.com/public/v1/channels",
        {
          params: { slug: login },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": process.env.KICK_CLIENT_ID,
          },
        }
      );

      const userIdKick = userDetailResponseKick.data.data[0]?.broadcaster_user_id;

      const userResponseKick = await axios.get(
        "https://api.kick.com/public/v1/users",
        {
          params: { id: userIdKick },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": process.env.KICK_CLIENT_ID,
          },
        }
      );

      const userChannelRaw = userDetailResponseKick.data.data[0];
      if (!userChannelRaw) {
        return res.status(200).json({ message: "User not found" });
      }

      const userUserRaw = userResponseKick.data.data[0];
      userId = userChannelRaw.broadcaster_user_id;

      userDetailsRaw = { ...userUserRaw, ...userChannelRaw, login: userChannelRaw.slug };
      liveStatus = await isUserLive(userIdKick, accessToken, 2);
    } else {
      const userIdResponse = await axios.get(
        "https://api.twitch.tv/helix/users",
        {
          params: { login },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": process.env.TWITCH_CLIENT_ID,
          },
        }
      );

      const userTwitch = userIdResponse.data.data[0];
      if (!userTwitch) return res.status(404).send("User not found");

      userId = userTwitch.id;

      const userDetailResponse = await axios.get(
        "https://api.twitch.tv/helix/users",
        {
          params: { id: userId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": process.env.TWITCH_CLIENT_ID,
          },
        }
      );

      userDetailsRaw = userDetailResponse.data.data[0];

      try {
        const colorRes = await axios.get(
          "https://api.twitch.tv/helix/chat/color",
          {
            params: { user_id: userId },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Client-ID": process.env.TWITCH_CLIENT_ID,
            },
          }
        );
        color = colorRes.data.data[0]?.color || null;
      } catch (error) {
        console.warn("Chat color fetch failed:", error.response?.data || error.message);
      }

      try {
        const followersRes = await axios.get(
          "https://api.twitch.tv/helix/channels/followers",
          {
            params: { broadcaster_id: userId },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Client-ID": process.env.TWITCH_CLIENT_ID,
            },
          }
        );
        totalFollowers = followersRes.data.total;
      } catch (error) {
        console.warn("Followers fetch failed:", error.response?.data || error.message);
      }

      try {
        const channelRes = await axios.get(
          "https://api.twitch.tv/helix/channels",
          {
            params: { broadcaster_id: userId },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Client-ID": process.env.TWITCH_CLIENT_ID,
            },
          }
        );
        channelInfo = channelRes.data.data[0] || null;
      } catch (error) {
        console.warn("Channel info fetch failed:", error.response?.data || error.message);
      }

      liveStatus = liveStatus || (await isUserLive(userId, accessToken, platformId));
    }

    const finalDetails = {
      user_id: userId,
      ...userDetailsRaw,
      color: color || "",
      total_followers: totalFollowers || "",
      channel_info: channelInfo || "",
      is_live: liveStatus?.isLive || false,
      viewer_count: liveStatus?.view || 0,
    };

    res.status(200).json(finalDetails);
  } catch (error) {
    console.error("An error occurred while fetching user data", error.response?.data || error.message);
    res.status(400).send("An error occurred while fetching user data");
  }
}


async function checkUserExistence(req, res) {
  const { channelId } = req.user;
  const { broadcasterId } = req.body;
  const { platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(UserChannels);
    const existingUser = await repo.findOneBy({ channelId: broadcasterId, platformId });

    if (existingUser) {
      return res.status(200).json({ exists: true, data: existingUser });
    }

    const { accessToken } = await fetchToken(channelId);
    let userResponse = null;

    if (platformId === 2) {
      userResponse = await axios.get(`https://api.kick.com/public/v1/users`, {
        params: { id: broadcasterId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.KICK_CLIENT_ID,
        },
      });
    } else {
      userResponse = await axios.get(`https://api.twitch.tv/helix/users`, {
        params: { id: broadcasterId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      });
    }

    const userData = userResponse.data.data[0];
    if (!userData) {
      return res.status(404).json({ exists: false, message: "User not found" });
    }

    const newUser = repo.create({
      channelId: broadcasterId,
      nameLogin: userData.login || userData.username,
      displayName: userData.display_name || userData.username,
      profileImageUrl: userData.profile_image_url || userData.avatar,
      platformId,
    });

    await repo.save(newUser);

    res.status(200).json({ exists: true, data: newUser });
  } catch (error) {
    console.error("Error checking user existence:", error.response?.data || error.message);
    res.status(500).send("Error checking user existence");
  }
}

async function toggleFavorite(req, res) {
  const { channelId } = req.user;
  const { broadcasterId } = req.body;
  const { platformId } = req.user;

  if (!broadcasterId) {
    return res.status(400).json({ message: "broadcasterId is required" });
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);
    const existingFavorite = await repo.findOneBy({ channelId, broadcasterId, platformId });

    if (existingFavorite) {
      await repo.delete({ channelId, broadcasterId, platformId });

      if (favoriteCache.has(channelId)) {
        favoriteCache.get(channelId).delete(broadcasterId);
      }

      return res.status(200).json({ message: "Removed from favorites", favorite: false });
    } else {
      const newFav = repo.create({ channelId, broadcasterId, platformId });
      await repo.save(newFav);

      if (!favoriteCache.has(channelId)) {
        favoriteCache.set(channelId, new Set());
      }
      favoriteCache.get(channelId).add(broadcasterId);

      return res.status(200).json({ message: "Added to favorites", favorite: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error.response?.data || error.message);
    res.status(500).send("Error toggling favorite");
  }
}

async function getFavorites(req, res) {
  const { id: channelId, platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(ViewFavoriteUsers);
    const favorites = await repo.findBy({ channelId, platformId });

    const formattedFavorites = favorites.map((fav) => ({
      broadcasterId: fav.broadcasterId,
      displayName: fav.displayName,
      nameLogin: fav.nameLogin,
      profileImageUrl: fav.profileImageUrl,
    }));

    res.status(200).json(formattedFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error.response?.data || error.message);
    res.status(500).send("Error fetching favorites");
  }
}

async function getUserSettings(req, res) {
  const {  channelId, platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(UserSetting);
    const settings = await repo.findOneBy({ userId:channelId, platformId });

    if (!settings) {
      return res.status(404).send("Settings not found");
    }
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching user settings:", error.response?.data || error.message);
    res.status(500).send("Error fetching user settings");
  }
}
const getFavoriteUser = async (req, res) => {
  const channelId = req.user.id; // Authenticated user's channel ID
  const { userId } = req.query; // ID للشخص المراد التحقق منه
  const { platformId } = req.user;

  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const repo = AppDataSource.getRepository(ViewFavoriteUsers);

    // البحث عن المستخدم في المفضلة
    const favoriteUser = await repo.findOne({
      where: { channelId: channelId, userId: userId, platformId },
    });

    if (!favoriteUser) {
      // غير موجود في المفضلة
      return res.status(200).json({ isFavorite: false });
    }

    // موجود في المفضلة، إرجاع البيانات الأساسية
    const result = {
      ...favoriteUser,
      isFavorite: true,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error fetching favorite user:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "An error occurred while fetching favorite user",
    });
  }
};

async function updateUserSettings(req, res) {
  const {channelId, platformId } = req.user;
  const newSettings = req.body;

  try {
    const repo = AppDataSource.getRepository(UserSetting);
    let existing = await repo.findOneBy({ userId:channelId, platformId });

    if (!existing) {
      existing = repo.create({ userId:channelId, platformId, ...newSettings });
    } else {
      Object.assign(existing, newSettings);
    }
    
    await repo.save(existing);

    res.status(200).json({ message: "Settings updated successfully", data: existing });
  } catch (error) {
    console.error("Error updating user settings:", error.response?.data || error.message);
    res.status(500).send("Error updating settings");
  }
}

async function getTwitchActivity(req, res) {
  const { id: channelId } = req.user;
  const { platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(TwitchActivity);
    const activities = await repo.findBy({ channelId, platformId });

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching Twitch activity:", error.response?.data || error.message);
    res.status(500).send("Error fetching Twitch activity");
  }
}

async function getTwitchStreaks(req, res) {
  const { id: channelId } = req.user;
  const { platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(TwitchStreaks);
    const streaks = await repo.findBy({ channelId, platformId });

    res.status(200).json(streaks);
  } catch (error) {
    console.error("Error fetching Twitch streaks:", error.response?.data || error.message);
    res.status(500).send("Error fetching Twitch streaks");
  }
}
const getFavorite = async (req, res) => {
  const { profileId } = req.params;
  const { platformId } = req.user;
  const channelId = req.user.id;

  if (!profileId) {
    return res.status(400).json({ error: "Profile ID is required" });
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);
    const repoSetting = AppDataSource.getRepository(UserSetting);

    // جلب إعدادات المستخدم
    const settingsArray = await repoSetting.find({
      where: { userId: profileId, platformId },
    });

    const settings =
      Array.isArray(settingsArray) && settingsArray.length > 0
        ? settingsArray[0]
        : null;

    // جلب كل المفضلين لهذا المستخدم
    let favorites = await repo.find({
      where: { channelId: profileId, platformId },
    });

    // التحقق من الإعدادات في حال المستخدم الحالي يختلف عن صاحب الملف
    if (channelId !== profileId) {
      if (settings) {
        if (settings.showFavorites === 1) {
          // إخفاء الكل
          favorites = [];
        } else if (settings.showFavorites === 0) {
          // إخفاء فقط الأشخاص private
          favorites = favorites.filter((fav) => fav.isPrivate !== 1);
        }
      }
    }

    res.status(200).json(favorites);
  } catch (error) {
    console.error(
      "Error fetching favorite users:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "An error occurred while fetching favorite users",
    });
  }
};
const getMyFavorite = async (req, res) => {
  const channelId = req.user.id; // Authenticated user's channel ID
  const { platformId } = req.user;

  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  try {
    const { accessToken } = await fetchToken(channelId);
    const repo = AppDataSource.getRepository(ViewFavoriteUsers);

    let favorites = await repo.find({
      where: { channelId: channelId, platformId },
    });

favorites = await Promise.all(
  favorites.map(async (user) => {
    let liveStatus
    
    if (platformId === 2) {
       liveStatus = await isUserLiveKick(user.userId, accessToken,2);
    }else{
      liveStatus = await isUserLive(user.userId, accessToken,1);

    }
        return {
          ...user,
          isLive: liveStatus?.isLive || false,
          viewerCount: liveStatus?.view || 0,
          title: liveStatus?.title || null,
          startedAt: liveStatus?.startedAt || null,
          duration: liveStatus?.duration || null,
        };
      })
    );

    res.status(200).json(favorites);
  } catch (error) {
    console.error(
      "Error fetching favorite users:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "An error occurred while fetching favorite users",
    });
  }
};
const updatePrivacy = async (req, res) => {
  const { userId, isPrivate } = req.body; // userId والـ 0/1 الجديد
  const channelId = req.user.id; // الشخص اللي عامل الطلب
  const { platformId } = req.user;

  if (!userId || typeof isPrivate === "undefined") {
    return res.status(400).json({ error: "userId and isPrivate are required" });
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    // نجد المستخدم المفضل الحالي
    const favorite = await repo.findOne({
      where: { channelId, userId, platformId },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite user not found" });
    }

    // تحديث الخصوصية
    favorite.isPrivate = isPrivate; // 0 أو 1
    await repo.save(favorite);

    res.status(200).json({
      message: "Privacy updated successfully",
      isPrivate,
    });
  } catch (error) {
    console.error(
      "Error updating privacy:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "An error occurred while updating privacy",
    });
  }
};
const createFavoriteUser = async (req, res) => {
  const {
    user_id,
    login,
    display_name,
    broadcaster_type,
    description,
    profile_image_url,
    color,
    total_followers,
  } = req.body;

  if (!user_id || !login) {
    return res.status(400).send("user_id and login are required");
  }

  const channelId = req.user.id;

  if (Number(channelId) === Number(user_id)) {
    return res.status(400).send("channelId cannot be equal to userId");
  }

  const { platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    const newFavorite = repo.create({
      id: uuidv4(),
      channelId,
      userId: user_id,
      login,
      displayName: display_name,
      broadcasterType: broadcaster_type,
      description,
      profileImageUrl: profile_image_url,
      color,
      totalFollowers: total_followers,
      platformId,
    });

    const saved = await repo.save(newFavorite);

    res.status(201).json({
      id: saved.id,
      user_id: saved.userId,
      username: saved.login,
      display_name: saved.displayName,
      broadcaster_type: saved.broadcasterType,
      bio: saved.description,
      profile_image: saved.profileImageUrl,
      color: saved.color,
      total_followers: saved.totalFollowers,
    });
  } catch (error) {
    console.error(
      "Error inserting user data:",
      error.response?.data || error.message
    );

    res.status(500).send("An error occurred while inserting user data");
  }
};
const deleteFavoriteUser = async (req, res) => {
  const { id } = req.body;
  const channelId = req.user.id;
  const { platformId } = req.user;

  if (!id) {
    return res.status(400).send("user_id is required");
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    // حاول العثور على السجل أولاً باستخدام userId أو id
    let userToDelete = await repo.findOne({
      where: { channelId, id, platformId },
    });

    if (!userToDelete) {
      userToDelete = await repo.findOne({
        where: { channelId, userId: id, platformId },
      });
    }

    if (!userToDelete) {
      return res.status(404).send("User not found in favorites");
    }

    await repo.remove(userToDelete);

    res.status(200).json({
      message: "User removed from favorites",
      deletedUserId: userToDelete.userId,
    });
  } catch (error) {
    console.error(
      "Error deleting user from favorites:",
      error.response?.data || error.message
    );

    res.status(500).send(
      "An error occurred while deleting user from favorites"
    );
  }
};
const getJoinedChannels = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(VwActiveUserTokensInfo);
    const channelJoin = await repo.find();
    res.status(200).json(channelJoin);
  } catch (error) {
    console.error(
      "❌ خطأ أثناء استرجاع القنوات:",
      error.response?.data || error.message
    );
  }
};

async function insertEvent(
  ActivityId,
  broadcasterId,
  broadcasterUsername,
  moderatorId,
  moderatorUsername,
  note,
  userId,
  username,
  reason,
  eventTime,
  typeId,
  counts,
  avatar,
  displayName
) {
  const { platformId } = req.user;

  try {
    const repo = AppDataSource.getRepository(TwitchActivity);

    const newEvent = repo.create({
      ActivityId,
      broadcasterId,
      broadcasterUsername,
      moderatorId,
      moderatorUsername,
      note,
      userId,
      username,
      reason,
      eventTime,
      typeId,
      counts,
      avatar,
      displayName,
      platformId,
    });

    await repo.save(newEvent);
  } catch (error) {
    console.error(
      "❌ Error inserting event:",
      error.response?.data || error.message
    );
  }
}
async function checkIfUserExists(req, res) {
  const { id } = req.query;
  const channelId = req.user.id;

  if (!id) {
    return res.status(400).send("ID is required");
  }

  try {
    const isHost = id === channelId;
    const userExists = await checkUserExistence(channelId, id);

    res.status(200).json({ isHost, userExists });
  } catch (error) {
    console.error(
      "Error checking user existence:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "An error occurred while checking user existence",
    });
  }
}
const loadFavoritesFromDB = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(UserFavorite);
    const favorites = await repo.find(); // جميع السجلات

    favoriteCache.clear();

    for (const fav of favorites) {
      const { channelId, userId } = fav;

      if (!favoriteCache.has(channelId)) {
        favoriteCache.set(channelId, new Set());
      }

      favoriteCache.get(channelId).add(userId);
    }
  } catch (error) {
    console.error(
      "❌ Error loading favorites cache:",
      error.response?.data || error.message
    );
  }
};

async function isUserLiveKick(userId, accessToken, refreshToken,data) {
  try {
    const response = await axios.get(
      "https://api.kick.com/public/v1/livestreams",
      {
        params: { broadcaster_user_id: userId },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const streamData = response.data.data;

    if (streamData.length > 0) {
      const startedAt = new Date(streamData[0].started_at);
      const now = new Date();
      const diffMs = now - startedAt;

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return {
        isLive: true,
        title: streamData[0].title,
        view: streamData[0].viewer_count || 0,
        startedAt: streamData[0].started_at,
        duration: `${hours}h ${minutes}m ${seconds}s`,
      };
    }

    return { isLive: false, view: 0, startedAt: null, duration: null };
  } catch (error) {
    console.warn(
      "Error fetching live status Kick:",
      error.response?.data || error.message
    );

    // فقط لو Unauthorized نحاول تحديث التوكن
    if (error.response?.status === 401 || error.response?.data?.message === "Unauthorized") {
      const newTokens = await refreshKickAccessToken(refreshToken,data);
      if (newTokens) {
        // نحاول مرة ثانية باستخدام التوكن الجديد
        return await isUserLiveKick(userId, newTokens.access_token, newTokens.refresh_token);
      }
    }

    return { isLive: false, view: 0, startedAt: null, duration: null };
  }
}

module.exports = {
  getUserProfile,loadFavoritesFromDB,
  updateUserLanguage,checkIfUserExists,
  isUserLive,getAllUserProfiles,isUserLiveKick,
  getChannelInfo,
  checkUserExistence,getChannelStatus,
  toggleFavorite,updatePrivacy,getJoinedChannels,
  getFavorites,
  getUserSettings,getMyFavorite,createFavoriteUser,
  updateUserSettings,
  getTwitchActivity,deleteFavoriteUser,
  getFavoriteUser,
  getTwitchStreaks,getFavorite
};
