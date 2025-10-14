    const { default: axios } = require("axios");
    const { AppDataSource } = require("../data-source");
    const { fetchToken } = require("../utils/Token");
const { UserConfig } = require("../entities/UserConfigModel");
const { UserFollowed } = require("../entities/UserFollowedModel");
const getFollowedUsers = async (req, res) => {
  const channelId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const isFollowed = req.query.isFollowed;

  try {
    const repo = AppDataSource.getRepository(UserFollowed);

    let whereClause = { channelId };
    if (isFollowed === '0' || isFollowed === '1' || isFollowed === '2') {
      whereClause.isfollowed = parseInt(isFollowed);
    }

    const [data, total] = await repo.findAndCount({
      where: whereClause,
      order: { followedAt: "DESC" },
      skip: offset,
      take: limit,
    });
    
    res.status(200).json({
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error retrieving followed users:", err);
    res.status(500).json({ error: "Error retrieving followed users" });
  }
};

const fetchFollowers = async (req, res) => {
  try {
    const channelId = req.user.id;
  const {accessToken} = await fetchToken(channelId);
    
    const first = parseInt(req.query.first) || 10;
    const after = req.query.after || null;

    const response = await axios.get('https://api.twitch.tv/helix/channels/followers', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
      },
      params: {
        broadcaster_id: channelId,
        first,
        after,
      },
    });

    const userIds = response.data.data.map(follower => follower.user_id);

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
      },
      params: {
        id: userIds,
      },
    });

    const userDetailsMap = {};
    userResponse.data.data.forEach(user => {
      userDetailsMap[user.id] = user;
    });

    const followersWithImages = response.data.data.map(follower => ({
      user_id: follower.user_id,
      user_login: follower.user_login,
      user_name: follower.user_name,
      followed_at: follower.followed_at,
      profile_image_url: userDetailsMap[follower.user_id]?.profile_image_url || '',
    }));

    followersWithImages.sort((a, b) => new Date(b.followed_at) - new Date(a.followed_at));

    res.status(200).json({
      data: followersWithImages,
      pagination: {
        cursor: response.data.pagination.cursor || null,
        total: response.data.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).send("Error fetching followers");
  }
};

const fetchAllFollowedUsers = async (req, res) => {
  try {
    const channelId = req.user.id;
    const {accessToken} = await fetchToken(channelId);
    let allFollowedUsers = [];
    let cursor = null;

    do {
      const response = await axios.get('https://api.twitch.tv/helix/channels/followed', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID,
        },
        params: {
          user_id: channelId,
          after: cursor,
        },
      });

      allFollowedUsers = allFollowedUsers.concat(response.data.data);
      cursor = response.data.pagination?.cursor;

    } while (cursor);

    res.status(200).json({
      total: allFollowedUsers.length,
      data: allFollowedUsers,
    });
  } catch (error) {
    console.error("Error fetching followed users:", error);
    res.status(500).send("Error fetching followed users");
  }
};


const updateFollowedUsers = async (req, res) => {
  const channelId = req.user.id;
const {accessToken} = await fetchToken(channelId);
  // تهيئة SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // -------- 1. جلب المتابَعين --------
    let allFollowedUsers = [];
    let cursorFollowed = null;

    do {
      const response = await axios.get("https://api.twitch.tv/helix/channels/followed", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
        params: { user_id: channelId, after: cursorFollowed },
      });

      allFollowedUsers = allFollowedUsers.concat(response.data.data);
      cursorFollowed = response.data.pagination?.cursor;

      res.write(`data: ${JSON.stringify({ step: "fetch_followed", count: allFollowedUsers.length })}\n\n`);
    } while (cursorFollowed);

    // -------- 2. جلب المتابعين --------
    let allFollowers = [];
    let cursorFollowers = null;

    do {
      const response = await axios.get("https://api.twitch.tv/helix/channels/followers", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
        params: { broadcaster_id: channelId, after: cursorFollowers },
      });

      allFollowers = allFollowers.concat(response.data.data);
      cursorFollowers = response.data.pagination?.cursor;

      res.write(`data: ${JSON.stringify({ step: "fetch_followers", count: allFollowers.length })}\n\n`);
    } while (cursorFollowers);

    // -------- 3. دمج وجلب بيانات المستخدمين --------
    const fetchUserBatchData = async (userIds) => {
      const response = await axios.get("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
        params: { id: userIds },
      });
      return response.data.data;
    };

    const followedIds = allFollowedUsers.map((u) => u.broadcaster_id);
    const followerIds = allFollowers.map((f) => f.user_id);
    const allUserIds = [...new Set([...followedIds, ...followerIds])];

    const followedWithStatus = [];
    const totalBatches = Math.ceil(allUserIds.length / 100);

    for (let i = 0; i < allUserIds.length; i += 100) {
      const batchIds = allUserIds.slice(i, i + 100);
      const userData = await fetchUserBatchData(batchIds);

      userData.forEach((user) => {
        const followed = allFollowedUsers.find((f) => f.broadcaster_id === user.id);
        const follower = allFollowers.find((f) => f.user_id === user.id);

        const isFollowing = !!followed;
        const isFollower = !!follower;
        let status = 0;
        if (isFollowing && isFollower) status = 1;
        else if (!isFollowing && isFollower) status = 2;

        let followedAt = null;
        if (followed?.followed_at) followedAt = new Date(followed.followed_at);
        else if (follower?.followed_at) followedAt = new Date(follower.followed_at);

        followedWithStatus.push({
          channelId: channelId,
          broadcasterId: user.id,
          broadcasterLogin: user.login,
          broadcasterName: user.display_name,
          followedAt,
          profileImage: user.profile_image_url,
          isfollowed: status,
        });
      });

      const progress = Math.round(((i + 100) / allUserIds.length) * 100);
      res.write(`data: ${JSON.stringify({
        step: "fetch_user_batches",
        batch: Math.floor(i / 100) + 1,
        totalBatches,
        progress
      })}\n\n`);
    }

    // -------- 4. تحديث قاعدة البيانات --------
    const repo = AppDataSource.getRepository(UserFollowed);
    await repo.delete({ channelId });
    await repo.save(followedWithStatus);

    // -------- 5. إنهاء SSE --------
    res.write(`data: ${JSON.stringify({ step: "done", message: "تم تحديث البيانات بنجاح" })}\n\n`);
    res.end();

  } catch (err) {
    console.error("Error in update-followed-users:", err);
    res.write(`data: ${JSON.stringify({ step: "error", message: "حدث خطأ أثناء التحديث" })}\n\n`);
    res.end();
  }
};

    module.exports = { getFollowedUsers,fetchAllFollowedUsers,fetchFollowers,updateFollowedUsers };
