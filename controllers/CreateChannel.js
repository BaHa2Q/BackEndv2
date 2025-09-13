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
    const existingChannel = await channelRepo.findOneBy({ channelId: channelData.id });
        
    await subscribeToChannel(channelData.id)
    if (existingChannel) {
      await channelRepo.update(
        { channelId: channelData.id },
        {
          nameLogin: channelData.login,
          displayName: channelData.display_name,
          profileImageUrl: channelData.profile_image_url,
          email:channelData.email
        }
      );
    } else {
      await subscribeToChannel(channelData.id)
      const newChannel = channelRepo.create({
        channelId: channelData.id,
        nameLogin: channelData.login,
        displayName: channelData.display_name,
        profileImageUrl: channelData.profile_image_url,
        email:channelData.email,
        isFirstJoin:0
        
      });
      await channelRepo.save(newChannel);
    }

    // 2. bots
    const botsRepo = AppDataSource.getRepository(Bots);
    const botsList = ["nightbot", "streamelements", "falkorie", "arabbots"];
    for (const username of botsList) {
      const exists = await botsRepo.findOneBy({
        channelId: channelData.id,
        username,
      });
      if (!exists) {
        await botsRepo.save(botsRepo.create({ channelId: channelData.id, username }));
      }
    }

    // 3. user_tokens
    const tokenRepo = AppDataSource.getRepository(UserTokens);
    const existingToken = await tokenRepo.findOneBy({ channelId: channelData.id });
    if (existingToken) {
      await tokenRepo.update(
        { channelId: channelData.id },
        {
          accessToken: channelData.access_token,
          refreshToken: channelData.refresh_token,
          scopes: channelData.scopes || '',
          updatedAt: new Date(),
        }
      );
    } else {
      await tokenRepo.save(tokenRepo.create({
        channelId: channelData.id,
        accessToken: channelData.access_token,
        refreshToken: channelData.refresh_token,
        scopes: channelData.scopes || '',
        updatedAt: new Date(),
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
      ];

      for (const row of defaultConfigs) {
        await configRepo.save(configRepo.create({
          channelId: channelData.id,
          configId: row.configId,
          status: row.status,
          roleId:row.roleId
        }));
      }
      const SettingsRepo = AppDataSource.getRepository(UserSetting);
      await SettingsRepo.save(SettingsRepo.create({
        userId: channelData.id,
        isStreaming: 0,
        isBotActive: 0,
        isNotifyActive: 0,
        isSoundNotify: 0,
      }));

      // 5. command_config
      const commandRepo = AppDataSource.getRepository(CommandConfig);
      const commandDefaults = [
        {
          action: "#addcom",
          defaults: "#اضافة",
          typeId: 1,
          roleId: 1,
        },
        {
          action: "#editcom",
          defaults: "#تعديل",
          typeId: 2,
          roleId: 2,
        },
        {
          action: "#delcom",
          defaults: "#حذف",
          typeId: 3,
          roleId: 3,
        },
      ];

      for (const row of commandDefaults) {
        await commandRepo.save(commandRepo.create({
          channelId: channelData.id,
          action: row.action,
          defaults: row.defaults,
          typeId: row.typeId,
          roleId: row.roleId,
        }));
      }
    }
  } catch (err) {
    console.error("❌ Error in CreateOrUpdateChannel:", err);
    throw err;
  }
};



module.exports = { CreateOrUpdateChannel };