const { RefreshingAuthProvider } = require("@twurple/auth");
const { insertEvent } = require("../controllers/ProfileController");
const { emitSocketEvent } = require("./socket");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const {
  VwActiveUserTokensInfo,
} = require("../entities/VwActiveUserTokensInfoModel");
const { AppDataSource } = require("../data-source");
const { v4: uuidv4 } = require("uuid");
const e = require("express");

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
  const joinedChannels = await repo.find({where: {platformId:1}}); // ✅ تأكد إنها ترجع مصفوفة
  if (!joinedChannels || joinedChannels.length === 0) {
    console.warn("⚠️ لا يوجد قنوات مفعّلة للاستماع إليها");
    return;
  }
  const authProvider = new RefreshingAuthProvider({
    clientId: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_CLIENT_SECRET,
  });

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

//     listener.onChannelSubscriptionMessage(channelId, async (event) => {
//       const typeId = 1;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Subscription", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         username: event.userDisplayName,
//         message: event.messageText,
//         count: event.cumulativeMonths || 1,
//         avatar: profileImage,
//         new: true,
//       });
//       await insertEvent(
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         null,
//         null,
//         null,
//         event.userId,
//         event.userDisplayName,
//         event.messageText,
//         null,
//         typeId,
//         event.cumulativeMonths || 1,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelSubscriptionGift(channelId, async (event) => {
//       const typeId = 2;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Subscription Gift", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         username: event.gifterDisplayName ?? "Anonymous",
//         count: event.amount,
//         new: true,
//       });
//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         null,
//         null,
//         null,
//         event.gifterId ?? null,
//         event.gifterDisplayName ?? "Anonymous",
//         null,
//         null,
//         typeId,
//         event.amount,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelRedemptionAdd(channelId, async (event) => {
//       const typeId = 3;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();

//       emitSocketEvent("Point", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         username: event.userDisplayName,
//         rewardTitle: event.rewardTitle,
//         avatar: profileImage,
//         new: true,
//         note: event.input || "",
//         displayName: event.rewardTitle,
//         counts: event.rewardCost,
//       });
//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         null,
//         null,
//         event.input,
//         event.userId,
//         event.userDisplayName,
//         null,
//         null,
//         typeId,
//         event.rewardCost,
//         profileImage,
//         event.rewardTitle,
//         platformId=1
//       );
//     });
//     listener.onChannelWarningSend(channelId, channelId, async (event) => {
//       const typeId = 4;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Warn", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         moderator: event.moderatorDisplayName,
//         username: event.userDisplayName,
//         message: event.reason,
//         avatar: profileImage,
//         new: true,
//       });
//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         event.moderatorId,
//         event.moderatorDisplayName,
//         null,
//         event.userId,
//         event.userDisplayName,
//         event.reason,
//         null,
//         typeId,
//         null,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelBan(channelId, async (event) => {
//       const isBan = event.isPermanent;
//       const typeId = isBan ? 5 : 6;
//       const className = isBan ? "Ban" : "Timeout";
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//         let timeoutDuration = null;
//         function getDurationShort(event) {
//   if (!event.startDate || !event.endDate) return null;

//   const start = new Date(event.startDate);
//   const end = new Date(event.endDate);
//   let diffMs = end - start;

//   const diffSec = Math.floor(diffMs / 1000);
//   if (diffSec < 60) return `${diffSec}s`;

//   const diffMin = Math.floor(diffSec / 60);
//   if (diffMin < 60) return `${diffMin}m`;

//   const diffHour = Math.floor(diffMin / 60);
//   if (diffHour < 24) return `${diffHour}h`;

//   const diffDay = Math.floor(diffHour / 24);
//   if (diffDay < 30) return `${diffDay}d`;

//   const diffMonth = Math.floor(diffDay / 30);
//   return `${diffMonth}month`;
// }

//   if (!isBan) {
//     timeoutDuration = getDurationShort(event);
//   }

//       emitSocketEvent(className, {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         moderator: event.moderatorDisplayName,
//         isPermanent: event.isPermanent,
//         username: event.userDisplayName,
//         message: event.reason,
//         time: event.endDate,
//         counts: timeoutDuration,
//         avatar: profileImage,
//         new: true,
//       });

//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         event.moderatorId,
//         event.moderatorDisplayName,
//         null,
//         event.userId,
//         event.userDisplayName,
//         event.reason,
//         event.endDate,
//         typeId,
//         timeoutDuration,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelCheer(channelId, async (event) => {
//       const typeId = 7;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Bits", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         username: event.isAnonymous ? "Anonymous" : event.userDisplayName,
//         message: event.message,
//         count: event.bits,
//         avatar: profileImage,
//         new: true,
//       });
//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         null,
//         null,
//         null,
//         event.userId,
//         event.isAnonymous ? "Anonymous" : event.userDisplayName,
//         event.message,
//         null,
//         typeId,
//         event.bits,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelRaidTo(channelId, async (event) => {
//       const typeId = 8;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Raid", {
//         ActivityId,
//         broadcasterId: event.raidedBroadcasterId,
//         username: event.raidingBroadcasterDisplayName,
//         count: event.viewers,
//         avatar: profileImage,
//         new: true,
//       });
//       await insertEvent(
//         ActivityId,
//         event.raidedBroadcasterId,
//         event.raidedBroadcasterDisplayName,
//         null,
//         null,
//         null,
//         event.raidedBroadcasterId,
//         event.raidingBroadcasterDisplayName,
//         null,
//         null,
//         typeId,
//         event.viewers,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
//     listener.onChannelFollow(channelId, channelId, async (event) => {
//       const typeId = 9;
//       const profileImage = await getUserImage(apiClient, event.userId);
//       const ActivityId = uuidv4();
//       emitSocketEvent("Follow", {
//         ActivityId,
//         broadcasterId: event.broadcasterId,
//         username: event.userDisplayName,
//         time: event.followDate,
//         avatar: profileImage,
//         new: true,
//       });

//       await insertEvent(
//         ActivityId,
//         event.broadcasterId,
//         event.broadcasterDisplayName,
//         null,
//         null,
//         null,
//         event.broadcasterId,
//         event.userDisplayName,
//         null,
//         event.followDate,
//         typeId,
//         null,
//         profileImage,
//         null,
//         platformId=1
//       );
//     });
  }
}

module.exports = { eventChannel };
