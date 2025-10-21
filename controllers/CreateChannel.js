// ✅ استيراد الـ Repositories
const { AppDataSource } = require("../data-source");
const { UserChannels } = require("../entities/UserChannelsModel");
const { ChatbotBots, Bots } = require("../entities/BotsModel");
const { UserTokens } = require("../entities/UserTokensModel");
const { UserConfig } = require("../entities/UserConfigModel");
const { CommandConfig } = require("../entities/CommandConfigModel");
const { UserSetting } = require("../entities/UserSettingModel");
const { subscribeToChannel } = require("../routes/twitchWebhookRoute");

const CreateOrUpdateChannel = async (channelData) => {
  
  
  try {
    // 1. القناة
    const channelRepo = AppDataSource.getRepository(UserChannels);
    const existingChannel = await channelRepo.findOneBy({ channelId: channelData.id,platformId:channelData.platformId });
          
    if (existingChannel) {
      await channelRepo.update(
        { channelId: channelData.id },
        {
          nameLogin: channelData.login,
          displayName: channelData.display_name,
          profileImageUrl: channelData.profile_image_url,
          email:channelData.email,
          platformId:channelData.platformId
        }
      );
    } else {
      const newChannel = channelRepo.create({
        channelId: channelData.id,
        nameLogin: channelData.login,
        displayName: channelData.display_name,
        profileImageUrl: channelData.profile_image_url,
        email:channelData.email,
        isFirstJoin:0,
          platformId:channelData.platformId
      });
      await channelRepo.save(newChannel);
    }
    if (channelData.platformId !== 2) {
      await subscribeToChannel(channelData.id);
    }
    // 2. bots
    const botsRepo = AppDataSource.getRepository(Bots);
    const botsList = ["nightbot", "streamelements", "falkorie", "yallabots"];
    const botsString = botsList.map(b => b.trim().toLowerCase()).join(":");

    // جلب السجل الحالي للقناة
    let existingBots = await botsRepo.findOneBy({ channelId: channelData.id,platformId:channelData.platformId });

    // فقط إذا لم يوجد سجل للقناة، نضيفه
    if (!existingBots) {
      await botsRepo.save(botsRepo.create({
        channelId: channelData.id,
        username: botsString,
          platformId:channelData.platformId
      }));
    }
    // 3. user_tokens
    const tokenRepo = AppDataSource.getRepository(UserTokens);
    const existingToken = await tokenRepo.findOneBy({ channelId: channelData.id,platformId:channelData.platformId });
    if (existingToken) {
      await tokenRepo.update(
        { channelId: channelData.id },
        {
          accessToken: channelData.access_token,
          refreshToken: channelData.refresh_token,
          username:channelData.login,
          scopes: channelData.scopes || '',
          updatedAt: new Date(),
          platformId:channelData.platformId
        }
      );
    } else {
      await tokenRepo.save(tokenRepo.create({
        channelId: channelData.id,
        accessToken: channelData.access_token,
        username:channelData.login,
        refreshToken: channelData.refresh_token,
        scopes: channelData.scopes || '',
        updatedAt: new Date(),
          platformId:channelData.platformId
      }));
    }

    // 4. user_config (إذا كانت القناة جديدة)
    if (!existingChannel) {
      const configRepo = AppDataSource.getRepository(UserConfig);
      

      const defaultConfigs = [
        { configId: 1, status: 1,roleId:5 },
        { configId: 2, status: 1,roleId:5 },
        { configId: 3, status: 1,roleId:5 },
        { configId: 5, status: 1,roleId:5 },
        { configId: 6, status: 1,roleId:1 },
        { configId: 7, status: 1,roleId:1 },
        { configId: 8, status: 1,roleId:1 },
        { configId: 9, status: 1,roleId:5 },
        { configId: 10, status: 1,roleId:5 },
        { configId: 11, status: 1,roleId:5 },
        { configId: 12, status: 1,roleId:5 },
        { configId: 13, status: 1,roleId:5 },
        { configId: 14, status: 1,roleId:5 },
        { configId: 15, status: 1,roleId:5 },
        { configId: 16, status: 1,roleId:5 },
        { configId: 17, status: 1,roleId:5 },
        { configId: 18, status: 1,roleId:5 },
        { configId: 19, status: 1,roleId:5 },
        { configId: 20, status: 1,roleId:5 },
        { configId: 21, status: 1,roleId:5 },
      ];

      for (const row of defaultConfigs) {
        await configRepo.save(configRepo.create({
          channelId: channelData.id,
          configId: row.configId,
          status: row.status,
          roleId:row.roleId,
          platformId:channelData.platformId
        }));
      }
      const SettingsRepo = AppDataSource.getRepository(UserSetting);
      await SettingsRepo.save(SettingsRepo.create({
        userId: channelData.id,
        isStreaming: 0,
        isBotActive: 0,
        isNotifyActive: 0,
        isSoundNotify: 0,
          platformId:channelData.platformId
      }));
    }
  } catch (err) {
    console.error("❌ Error in CreateOrUpdateChannel:", err);
    throw err;
  }
};



module.exports = { CreateOrUpdateChannel };