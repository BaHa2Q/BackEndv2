const { AppDataSource } = require('../data-source');
const { UserTokens } = require('../entities/UserTokensModel');
const { BotTokens } = require('../entities/BotTokensModel');

const getRepo = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource.getRepository(UserTokens);
};

const getBot_TokenRepo = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource.getRepository(BotTokens);
};

const fetchToken = async (channelId) => {
  try {
    const repo = await getRepo();
    const tokenRow = await repo.findOneBy({ channelId: channelId });
    return tokenRow ? tokenRow.accessToken : null;
  } catch (err) {
    console.error("Error fetching token:", err);
    return null;
  }
};

const fetchBotToken = async (name) => {
  try {
    const repo = await getBot_TokenRepo();
    const row = await repo.findOneBy({ NAME: name });
    return row ? row.accessToken : null;
  } catch (err) {
    console.error("Error fetching bot token:", err);
    return null;
  }
};

const AllRefresh = async () => {
  try {
    const repo = await getRepo();
    const botRepo = await getBot_TokenRepo();

    const tokens = await repo.find();
    const botTokens = await botRepo.find();

    return {
      userTokens: tokens.length ? tokens : [],
      botTokens: botTokens.length ? botTokens : [],
    };
  } catch (err) {
    console.error("Error fetching tokens:", err);
    return {
      userTokens: [],
      botTokens: [],
    };
  }
};

const updateTokenInDB = async (channelId, accessToken, refreshToken) => {
  try {
    const repo = await getRepo();
    const token = await repo.findOneBy({ channelId: channelId });

    if (!token) {
      console.log(`❌ No channel found with ID ${channelId}`);
      return;
    }

    token.accessToken = accessToken;
    token.refreshToken = refreshToken;
    token.updatedAt = new Date();

    await repo.save(token);
    console.log(`✅ Token updated successfully for channel ${channelId}`);
  } catch (err) {
    console.error(`❌ Error while updating token:`, err.message);
  }
};

const updateTokenInDBBot = async (id, accessToken, refreshToken) => {
  try {

    
    const repo = await getBot_TokenRepo();
    const bot = await repo.findOneBy({ id});

    if (!bot) {
      console.log(`❌ No bot found with name ${id}`);
      return;
    }

    bot.accessToken = accessToken;
    bot.refreshToken = refreshToken;
    bot.expiresIn = Math.floor(Date.now() / 1000); // New timestamp
    await repo.save(bot);
    console.log(`✅ Bot token updated successfully for ${id}`);
  } catch (err) {
    console.error(`❌ Error while updating bot token for ${id}:`, err.message);
  }
};

module.exports = {
  fetchToken,
  fetchBotToken,
  AllRefresh,
  updateTokenInDB,
  updateTokenInDBBot,
};
