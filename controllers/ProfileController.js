const { AppDataSource } = require("../data-source");
const axios = require("axios");
const { UserChannels } = require("../entities/UserChannelsModel");
const { UserFavorite } = require("../entities/UserFavoriteModel");
const { UserSetting } = require("../entities/UserSettingModel");
const { ViewFavoriteUsers } = require("../entities/ViewFavoriteUsersModel");
const { VwActiveUserTokensInfo } = require("../entities/VwActiveUserTokensInfoModel");
const { TwitchActivity } = require("../entities/TwitchActivityModel");
const { TwitchStreaks } = require("../entities/TwitchStreaksModel");
const { v4: uuidv4 } = require('uuid');

const { fetchToken } = require("../utils/Token");
const { VwAllUserTokensInfo } = require("../entities/VwAllUserTokensInfoModel");
const favoriteCache = new Map(); // المفتاح: channelId ، القيمة: Set من broadcasterIds

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const repo = AppDataSource.getRepository(VwAllUserTokensInfo);
    const user = await repo.findOneBy({ channelId: userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // محاولة جلب لون الشات
    let color = null;
    try {
      const accessToken = await fetchToken(userId);

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
    } catch (colorError) {
     
    }

    // إرسال البيانات
    res.status(200).json({
      id: user.channelId,
      login: user.nameLogin,
      display_name: user.displayName,
      profile_image_url: user.profileImageUrl,
      email:user.email,
      isSubscribed: user.isSubscribed,
      color: color || "#fff",
      language : user.language,
      isFirstJoin:user.isFirstJoin
    });
  } catch (err) {
    console.error(err);
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
  } catch (err) {
    console.error("Error fetching profiles:", err);
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
  } catch (err) {
    console.error("Error fetching channel status:", err);
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

async function isUserLive(userId, accessToken) {
  try {
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          "Client-ID": "44w2981dj04apt8a3i1wut80a9oz5a", // Replace with your Twitch Client ID
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const streamData = response.data.data;

    if (streamData.length > 0) {
      const startedAt = new Date(streamData[0].started_at);
      const now = new Date();

      // فرق الوقت بالميلي ثانية
      const diffMs = now - startedAt;

      // حول الفرق إلى ساعات/دقايق/ثواني
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return {
        isLive: true,
        title: streamData[0].title,
        view: streamData[0].viewer_count,
        startedAt: streamData[0].started_at,
        duration: `${hours}h ${minutes}m ${seconds}s`, // المدة الحالية
      };
    }

    return {
      isLive: false,
      view: 0,
      startedAt: null,
      duration: null,
    };
  } catch (error) {
    console.error("Error checking user live status:", error);
    return {
      isLive: false,
      view: 0,
      startedAt: null,
      duration: null,
    };
  }
}

async function getChannelInfo(req, res) {
  const login = req.query;

  if (!login || !login.login) {
    return res.status(400).send("Login is required");
  }

  const channelId = req.user.id;

  try {
    const accessToken = await fetchToken(channelId);

    // Get user ID from login name
    const userIdResponse = await axios.get(
      "https://api.twitch.tv/helix/users",
      {
        params: { login: login.login },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const user = userIdResponse.data.data[0];
    if (!user) {
      return res.status(404).send("User not found");
    }

    const userId = user.id;

    // Fetch user details again (redundant but kept as per original logic)
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

    const userDetailsRaw = userDetailResponse.data.data[0];

    // Fetch optional data
    let color = null;
    let totalFollowers = null;
    let channelInfo = null;

    try {
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

      color = colorResponse.data.data[0]?.color || null;
    } catch (err) {
      console.warn("Chat color fetch failed:", err.message);
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
    } catch (err) {
      console.warn("Followers fetch failed:", err.message);
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
    } catch (err) {
      console.warn("Channel info fetch failed:", err.message);
    }

    const liveStatus = await isUserLive(userId, accessToken);

    const finalDetails = {
      user_id: userId,
      ...userDetailsRaw,
      color: color,
      total_followers: totalFollowers,
      channel_info: channelInfo,
      is_live: liveStatus.isLive,
      viewer_count: liveStatus.view,
    };

    res.status(200).json(finalDetails);
  } catch (error) {
    console.error(
      "Error fetching user data:",
      error.response?.data || error.message
    );
    res.status(500).send("An error occurred while fetching user data");
  }
}
const checkUserExistence = async (channelId, userId) => {
  const repo = AppDataSource.getRepository(UserFavorite);

  const exists = await repo.findOne({
    where: {
      channelId,
      userId,
    },
  });

  return !!exists;
};
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
  } catch (err) {
    console.error("Error checking user existence:", err.message);
    res
      .status(500)
      .json({ error: "An error occurred while checking user existence" });
  }
}
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(UserSetting);

    const settings = await repo.findOne({ where: { userId: userId } });

    if (!settings) {
      return res.status(404).send("User not found");
    }

    res.status(200).json(settings);
  } catch (err) {
    console.error("Error fetching user settings:", err);
    res.status(500).send("Error fetching user settings");
  }
};

const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(UserSetting);

    const existing = await repo.findOne({ where: { userId: userId } });

    if (!existing) {
      return res.status(404).send("User not found");
    }

    const {
      is_streaming,
      is_bot_active,
      is_notify_active,
      is_sound_notify,
      show_favorites,
    } = req.body;

    // تحديث القيم
    existing.isStreaming = is_streaming;
    existing.isBotActive = is_bot_active;
    existing.isNotifyActive = is_notify_active;
    existing.isSoundNotify = is_sound_notify;
    existing.showFavorites = show_favorites;

    await repo.save(existing);

    res.status(200).send("Settings updated successfully");
  } catch (err) {
    console.error("Error updating user settings:", err);
    res.status(500).send("Error updating user settings");
  }
};

// const getFavorite = async (req, res) => {
//   const { profileId } = req.query;
//   if (!profileId) {
//     return res.status(400).json({ error: "Profile ID is required" });
//   }

//   try {
//     const repo = AppDataSource.getRepository(UserFavorite);

//     const favorite = await repo.find({
//       where: { channelId: profileId },
//     });

//     res.status(200).json(favorite);
//   } catch (err) {
//     console.error("Error fetching favorite users:", err);
//     res
//       .status(500)
//       .json({ error: "An error occurred while fetching favorite users" });
//   }
// };
const getFavorite = async (req, res) => {
  const { profileId } = req.params; 
  const channelId = req.user.id;

  if (!profileId) {
    return res.status(400).json({ error: "Profile ID is required" });
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);
    const repoSetting = AppDataSource.getRepository(UserSetting);

    // جلب إعدادات المستخدم
    const settingsArray = await repoSetting.find({ where: { userId: profileId } });
    const settings = Array.isArray(settingsArray) && settingsArray.length > 0 ? settingsArray[0] : null;

    // جلب كل المفضلين لهذا المستخدم
    let favorites = await repo.find({ where: { channelId: profileId } });

    if (channelId !== profileId) {
      // إذا توجد إعدادات و showFavorites = 1 → نُظهر فقط المفضلات الخاصة
      if (settings && settings.showFavorites === 1) {
        favorites = favorites.filter(fav => fav.isPrivate === 1);
      }
      // إذا لم توجد إعدادات أو showFavorites ≠ 1 → نُظهر جميع المفضلات
    }

    // صاحب الملف يرى كل شيء دائمًا

    res.status(200).json(favorites);
  } catch (err) {
    console.error("Error fetching favorite users:", err);
    res.status(500).json({ error: "An error occurred while fetching favorite users" });
  }
};


const updatePrivacy = async (req, res) => {
  const { userId, isPrivate } = req.body; // userId والـ 0/1 الجديد
  const channelId = req.user.id; // الشخص اللي عامل الطلب

  if (!userId || typeof isPrivate === 'undefined') {
    return res.status(400).json({ error: "userId and isPrivate are required" });
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    // نجد المستخدم المفضل الحالي
    const favorite = await repo.findOne({ where: { channelId, userId } });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite user not found" });
    }

    // تحديث الخصوصية
    favorite.isPrivate = isPrivate; // 0 أو 1
    await repo.save(favorite);

    res.status(200).json({ message: "Privacy updated successfully", isPrivate });
  } catch (err) {
    console.error("Error updating privacy:", err);
    res.status(500).json({ error: "An error occurred while updating privacy" });
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
    color,total_followers
  } = req.body;

  if (!user_id || !login) {
    return res.status(400).send("user_id and login are required");
  }

  const channelId = req.user.id;

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    const newFavorite = repo.create({
      id: uuidv4(),
      channelId,
      userId:user_id,
      login,
      displayName:display_name,
      broadcasterType:broadcaster_type,
      description,
      profileImageUrl:profile_image_url,
      color,
      totalFollowers: total_followers
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
      total_followers: saved.totalFollowers
    });
  } catch (err) {
    console.error("Error inserting user data:", err);
    res.status(500).send("An error occurred while inserting user data");
  }
};
const deleteFavoriteUser = async (req, res) => {
  const { id } = req.body;
  console.log(id);
  
  const channelId = req.user.id;

  if (!id) {
    return res.status(400).send("user_id is required");
  }

  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    const userToDelete = await repo.findOne({
      where: {
        channelId,
        id,
      },
    });

    if (!userToDelete) {
      return res.status(404).send("User not found in favorites");
    }

    await repo.remove(userToDelete);

    res.status(200).json({ message: "User removed from favorites" });
  } catch (err) {
    console.error("Error deleting user from favorites:", err);
    res.status(500).send("An error occurred while deleting user from favorites");
  }
};

const getMyFavorite = async (req, res) => {
  const channelId = req.user.id; // Authenticated user's channel ID

  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  try {
    const accessToken = await fetchToken(channelId);
    const repo = AppDataSource.getRepository(ViewFavoriteUsers);

    let favorites = await repo.find({
      where: { channelId: channelId },
    });

    favorites = await Promise.all(
      favorites.map(async (user) => {
        const liveStatus = await isUserLive(user.userId, accessToken);
        
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
  } catch (err) {
    console.error("Error fetching favorite users:", err);
    res.status(500).json({ error: "An error occurred while fetching favorite users" });
  }
};
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

    console.log("✅ Loaded favorite broadcasters cache");
  } catch (err) {
    console.error("❌ Error loading favorites cache:", err);
  }
}
async function showWhoAddFavorite(broadcasterId) {
  try {
    const repo = AppDataSource.getRepository(UserFavorite);

    const records = await repo.find({
      where: { userId: broadcasterId },
      select: ["channelId"],
    });

    return records.map(r => r.channelId); // فقط الآيدي تبع القناة
  } catch (err) {
    console.error("❌ Error loading favorites:", err);
    return [];
  }
}
function isBroadcasterFavorite(broadcasterId, channelId) {
  return favoriteCache.get(channelId)?.has(broadcasterId) ?? false;
}
const getJoinedChannels = async (req, res) => {

  try {
    const repo = AppDataSource.getRepository(VwActiveUserTokensInfo);

    const channelJoin = await repo.find()
    
     res.status(200).json(channelJoin );
  } catch (err) {
    console.error('❌ خطأ أثناء استرجاع القنوات:', err);
  } 
}
async function insertEvent(ActivityId,broadcasterId,broadcasterUsername,moderatorId,moderatorUsername,userId,username,reason,eventTime,typeId,counts,avatar) {
  try {
    const repo = AppDataSource.getRepository(TwitchActivity);

    const newEvent = repo.create({
      ActivityId,
      broadcasterId,
      broadcasterUsername,
      moderatorId,
      moderatorUsername,
      userId,
      username,
      reason,
      eventTime,
      typeId,
      counts,
      avatar,
    });

    await repo.save(newEvent);
    // console.log("✅ Event inserted successfully.");
  } catch (err) {
    console.error("❌ Error inserting event:", err.message);
  }
}


module.exports = {
  getUserProfile,isBroadcasterFavorite,loadFavoritesFromDB,showWhoAddFavorite,getJoinedChannels,insertEvent,
  getAllUserProfiles,updateUserLanguage,
  getChannelStatus,
  getChannelInfo,
  checkIfUserExists,
  getUserSettings,updatePrivacy,
  updateUserSettings,
  getFavorite,isUserLive,
  getMyFavorite,createFavoriteUser,deleteFavoriteUser
};
