const { default: axios } = require("axios");
// const { getTokenBot, updateBotToken } = require("./database");
const jwt = require("jsonwebtoken");
const { CreateOrUpdateChannel } = require("./CreateChannel");
const { UserTokens } = require("../entities/UserTokensModel");
const { AppDataSource } = require("../data-source");
require("dotenv").config();
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const CLIENT_ID = process.env.KICK_CLIENT_ID;
const introspectToken = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token required" });

  try {
    const response = await axios.post(
      "https://api.kick.com/public/v1/token/introspect",
      {}, // body فارغ لأن Kick لا يحتاج بيانات إضافية
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error introspecting token:", error.response?.data || error.message);
    res.status(401).json({ error: "Unauthorized or token expired" });
  }
};


const refreshKickToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).send("Refresh token is required");
  }

  try {
    // 1) اطلب Access Token جديد من Twitch
    const response = await axios.post(
      "https://id.kick.com/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID, 
        client_secret: CLIENT_SECRET,
        refresh_token: refresh_token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token: new_refresh_token } = response.data;
    
    console.log("🟢 New Access Token:", access_token);
    console.log("🔄 New Refresh Token:", new_refresh_token);

    const userResp = await axios.get("https://api.kick.com/public/v1/users", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const channelData = userResp.data.data[0]; // تأكد من الوصول إلى البيانات بشكل صحيح
 
    channelData.access_token = access_token;
    channelData.refresh_token = refresh_token;
    channelData.platformId = 2;

    channelData.id = channelData.user_id;
    channelData.login = channelData.name;
    channelData.profile_image_url = channelData.profile_picture;
    // عمل JWT مثل Twitch
    const token = jwt.sign(
      {
        id: channelData.user_id,
        login: channelData.name,
        access_token: channelData.access_token,
        refresh_token: channelData.refresh_token,
        platformId: channelData.platformId
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // حفظ أو تحديث القناة في قاعدة البيانات
    await CreateOrUpdateChannel(channelData);

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
async function refreshKickAccessToken(refresh_token, data) {  
  try {
    if (!refresh_token) {
      console.warn("⚠️ No refresh token provided for Kick refresh.");
      return null;
    }

    const response = await axios.post(
      "https://id.kick.com/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true,
      }
    );

    if (response.status !== 200) {
      console.error("❌ Kick token refresh failed:", response.data);
      return null;
    }

    const { access_token, refresh_token: new_refresh_token } = response.data;

    if (!access_token || !new_refresh_token) {
      console.error("❌ Invalid response structure from Kick:", response.data);
      return null;
    }

    // 🔹 تحديث البيانات قبل الحفظ
    data.accessToken = access_token;
    data.refreshToken = new_refresh_token;

    await updateUserToken(data);

    return { access_token, refresh_token: new_refresh_token };
  } catch (error) {
    console.error(
      "❌ Exception while refreshing Kick token:",
      error.response?.data || error.message
    );
    return null;
  }
}


async function updateUserToken(tokenData) {
  try {
    const repo = AppDataSource.getRepository(UserTokens);

    // البحث عن السجل الموجود
    const existing = await repo.findOneBy({
      channelId: tokenData.channelId,
      platformId: tokenData.platformId,
    });

    if (!existing) {
      console.warn(`⚠️ No token record found for channelId: ${tokenData.channelId}, platformId: ${tokenData.platformId}`);
      return null; // لم يتم التحديث
    }

    // تحديث الحقول المطلوبة
    existing.accessToken = tokenData.accessToken;
    existing.refreshToken = tokenData.refreshToken;
    existing.username = tokenData.username;
    existing.scopes = tokenData.scopes || existing.scopes;

    await repo.save(existing);

    // إنشاء JWT جديد بعد التحديث
    const token = jwt.sign(
      {
        id: existing.channelId,
        login: existing.username,
        access_token: existing.accessToken,
        refresh_token: existing.refreshToken,
        platformId: existing.platformId
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log(`🔄 Updated tokens and generated new JWT for ${existing.username || existing.channelId} (platform ${existing.platformId})`);
    
    return token; // ترجع التوكن الجديد
  } catch (err) {
    console.error("❌ Error updating user token:", err);
    return null;
  }
}

module.exports = {refreshKickToken,introspectToken,refreshKickAccessToken}