const { default: axios } = require("axios");

const jwt = require('jsonwebtoken');
const { CreateChannel, CreateOrUpdateChannel } = require("./CreateChannel");
const jwtSecret = process.env.JWT_SECRET;    
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const redirectUri = process.env.TWITCH_REDIRECT_URI;
const LoginTwitch  = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Authorization code not found');

try {
  const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }
  });

  const { access_token, refresh_token,  scope } = tokenResponse.data;

  const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Client-Id': clientId
    }
  });

  const channelData = userResponse.data.data[0];

  // أضف الـ scopes هنا بعد تعريف channelData
  channelData.scopes = Array.isArray(scope) ? scope.join(',') : '';

  channelData.access_token = access_token;
  channelData.refresh_token = refresh_token;

  // باقي الكود كما هو
  const token = jwt.sign(
    {
      id: channelData.id,
      login: channelData.login,
      access_token: channelData.access_token,
      refresh_token: channelData.refresh_token
      
    },
    jwtSecret,
    { expiresIn: '30d' }
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
  console.error(error.response?.data || error.message);
  res.status(500).send('Error getting token from Twitch');
}
};


module.exports = {LoginTwitch};
