const { RefreshingAuthProvider } = require("@twurple/auth");
const { insertEvent } = require("../controllers/ProfileController");
const { emitSocketEvent } = require("./socket");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { VwActiveUserTokensInfo } = require("../entities/VwActiveUserTokensInfoModel");
const { AppDataSource } = require("../data-source");
const { v4: uuidv4 } = require('uuid');

async function getUserImage(apiClient, userId) {
  if (!userId) return null;
  try {
    const user = await apiClient.users.getUserById(userId);
    return user?.profilePictureUrl ?? null;
  } catch (err) {
    console.error("❌ Error fetching profile image:", err);
    return null;
  }
}
 
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
async function eventChannel() {
    const repo = AppDataSource.getRepository(VwActiveUserTokensInfo);
    const joinedChannels = await repo.find(); // ✅ تأكد إنها ترجع مصفوفة    
    if (!joinedChannels || joinedChannels.length === 0) {
      console.warn("⚠️ لا يوجد قنوات مفعّلة للاستماع إليها");
      return;
    }
  const authProvider = new RefreshingAuthProvider({ clientId:TWITCH_CLIENT_ID, clientSecret:TWITCH_CLIENT_SECRET });

  for (const channel of joinedChannels) {
    
    const { channelId, accessToken, refreshToken } = channel || [];
    await authProvider.addUserForToken({
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: 0,
      obtainmentTimestamp: 0,
    });

    const apiClient = new ApiClient({ authProvider });
    const listener = new EventSubWsListener({ apiClient });
    
    await listener.start();

    listener.onChannelSubscriptionMessage(channelId, async (event) => {
      const typeId = 1;
      const profileImage = await getUserImage(apiClient, event.userId);
    const ActivityId = uuidv4();
      emitSocketEvent("Subscription", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        username: event.userDisplayName,
        message: event.messageText,
        count: event.cumulativeMonths || 1,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        event.broadcasterId,
        event.broadcasterDisplayName,
        null,
        null,
        event.userId,
        event.userDisplayName,
        event.messageText,
        null,
        typeId,
        event.cumulativeMonths || 1,
        profileImage
      );
    });
    listener.onChannelSubscriptionGift(channelId, async (event) => {
      const typeId = 2;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Subscription Gift", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        username: event.gifterDisplayName ?? "Anonymous",
        count: event.amount,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        null,
        null,
        event.gifterId ?? null,
        event.gifterDisplayName ?? "Anonymous",
        null,
        null,
        typeId,
        event.amount,
        profileImage
      );
    });
    listener.onChannelRedemptionAdd(channelId, async (event) => {
      const typeId = 3;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Point", {
        
        ActivityId,
        broadcasterId: event.broadcasterId,
        username: event.userDisplayName,
        rewardTitle: event.rewardTitle,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        null,
        null,
        event.userId,
        event.userDisplayName,
        event.rewardTitle,
        null,
        typeId,
        null,
        profileImage
      );
    });
    listener.onChannelWarningSend(channelId, channelId, async (event) => {
      const typeId = 4;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Warn", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        moderator: event.moderatorDisplayName,
        username: event.userDisplayName,
        message: event.reason,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        event.moderatorId,
        event.moderatorDisplayName,
        event.userId,
        event.userDisplayName,
        event.reason,
        null,
        typeId,
        null,
        profileImage
      );
    });
    listener.onChannelBan(channelId, async (event) => {
      const typeId = event.isPermanent ? 5 : 6;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Ban", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        moderator: event.moderatorDisplayName,
        isPermanent: event.isPermanent,
        username: event.userDisplayName,
        message: event.reason,
        time: event.endDate,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        event.moderatorId,
        event.moderatorDisplayName,
        event.userId,
        event.userDisplayName,
        event.reason,
        event.endDate,
        typeId,
        null,
        profileImage
      );
    });
    listener.onChannelCheer(channelId, async (event) => {
      const typeId = 7;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Bits", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        username: event.isAnonymous ? "Anonymous" : event.userDisplayName,
        message: event.message,
        count: event.bits,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        null,
        null,
        event.userId,
        event.isAnonymous ? "Anonymous" : event.userDisplayName,
        event.message,
        null,
        typeId,
        event.bits,
        profileImage
      );
    });
    listener.onChannelRaidTo(channelId, async (event) => {
      const typeId = 8;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Raid", {
        ActivityId,
        broadcasterId: event.raidedBroadcasterId,
        username: event.raidingBroadcasterDisplayName,
        count: event.viewers,
        avatar: profileImage,
        new: true
      });
      await insertEvent(
        ActivityId,
        event.raidedBroadcasterId,
        event.raidedBroadcasterDisplayName,
        null,
        null,
        event.raidedBroadcasterId,
        event.raidingBroadcasterDisplayName,
        null,
        null,
        typeId,
        event.viewers,
        profileImage
      );
    });
    listener.onChannelFollow(channelId, channelId, async (event) => {
      const typeId = 9;
      const profileImage = await getUserImage(apiClient, event.userId);
      const ActivityId = uuidv4();
      emitSocketEvent("Follow", {
        ActivityId,
        broadcasterId: event.broadcasterId,
        username: event.userDisplayName,
        time: event.followDate,
        avatar: profileImage,
        new: true
      });

      await insertEvent(
          ActivityId,
        event.broadcasterId,
        event.broadcasterDisplayName,
        null,
        null,
        event.broadcasterId,
        event.userDisplayName,
        null,
        event.followDate,
        typeId,
        null,
        profileImage
      );
    });
  }
}


module.exports ={eventChannel}