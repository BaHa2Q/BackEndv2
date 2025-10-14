const { default: axios } = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { CreateOrUpdateChannel } = require("./CreateChannel");
const jwtSecret = process.env.JWT_SECRET;
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const redirectUri = process.env.TWITCH_REDIRECT_URI;
const TOKENS = {};
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const CLIENT_ID = process.env.KICK_CLIENT_ID;
const redirectUriKick = process.env.KICK_REDIRECT_URI

function base64URLEncode(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}
const callbackTwitch = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authorization code not found");

  try {
    const tokenResponse = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        },
      }
    );

    const { access_token, refresh_token, scope } = tokenResponse.data;

    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": clientId,
      },
    });

    const channelData = userResponse.data.data[0];

    // أضف الـ scopes هنا بعد تعريف channelData
    channelData.scopes = Array.isArray(scope) ? scope.join(",") : "";
    channelData.access_token = access_token;
    channelData.refresh_token = refresh_token;
    // باقي الكود كما هو
    const token = jwt.sign(
      {
        id: channelData.id,
        login: channelData.login,
        access_token: channelData.access_token,
        refresh_token: channelData.refresh_token,
        platformId: 1
      },
      jwtSecret,
      { expiresIn: "30d" }
    );

    await CreateOrUpdateChannel(channelData);

    res.send(`
    <script>
      window.opener.postMessage({
        type: 'TWITCH_AUTH_SUCCESS',
        token: '${token}'
      }, '*');
      window.close();
    </script>
  `);
  } catch (error) {
    console.error("Error getting token from Twitch" ,error.response?.data || error.message);
    res.status(500).send("Error getting token from Twitch");
  }
};

const callbackKick = async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || state !== req.session.state)
    return res.status(400).send("Invalid state or missing code");

  try {
    // طلب التوكن من Kick
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("redirect_uri", redirectUriKick);
    params.append("code_verifier", req.session.code_verifier);
    params.append("code", code);

    const tokenResp = await axios.post(
      "https://id.kick.com/oauth/token",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );


    const { access_token, refresh_token, scope } = tokenResp.data;
    

    // جلب بيانات المستخدم/القناة من Kick
    const userResp = await axios.get("https://api.kick.com/public/v1/users", {
      headers: { Authorization: `Bearer ${access_token}` },
    });


    const channelData = userResp.data.data[0]; 


    channelData.scopes = scope ? scope.split(" ").join(",") : "";
    channelData.access_token = access_token;
    channelData.refresh_token = refresh_token;
    channelData.id = channelData.user_id;
    channelData.login = channelData.name;
    channelData.display_name = channelData.name
    channelData.profile_image_url = channelData.profile_picture;
    // عمل JWT مثل Twitch
    const token = jwt.sign(
      {
        id: channelData.user_id,
        login: channelData.name,
        access_token: channelData.access_token,
        refresh_token: channelData.refresh_token,
        platformId: 2
      },
      jwtSecret,
      { expiresIn: "30d" }
    );

    // حفظ أو تحديث القناة في قاعدة البيانات
    await CreateOrUpdateChannel(channelData);

    // إرسال الرسالة للواجهة
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'KICK_AUTH_SUCCESS',
          token: '${token}'
        }, '*');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error getting token from Kick");
  }
};
const LoginKick = async (req, res) => {
  // create code_verifier & code_challenge & state
  const code_verifier = base64URLEncode(crypto.randomBytes(32));
  const code_challenge = base64URLEncode(sha256(code_verifier));
  const state = crypto.randomBytes(8).toString("hex");

  req.session.code_verifier = code_verifier;
  req.session.state = state;

const scope = encodeURIComponent(
  "chat:write events:subscribe user:read channel:read channel:edit"
); // choose scopes your app needs
  const url = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUriKick
  )}&scope=${scope}&code_challenge=${code_challenge}&code_challenge_method=S256&state=${state}`;
  res.redirect(url);
};

module.exports = { callbackTwitch, LoginKick, callbackKick };
