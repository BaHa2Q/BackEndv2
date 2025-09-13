const { EntitySchema } = require("typeorm");

const TwitchStreaksView = new EntitySchema({
  name: "TwitchStreaksView",
  tableName: "TWITCH_STREAKS_VIEW",
  columns: {
    seq: {
      type: Number,
      nullable: true,
            primary: true,

      name: "SEQ",
    },
    channelId: {
      type: String,
      length: 50,
      nullable: false,
      name: "CHANNEL_ID",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    userId: {
      type: String,
      length: 50,
      nullable: false,
      name: "USER_ID",
    },
    streak: {
      type: Number,
      nullable: true,
      name: "STREAK",
    },
    subscriptionCount: {
      type: Number,
      nullable: true,
      name: "SUBSCRIPTION_COUNT",
    },
    subscriptionDurationText: {
      type: String,
      length: 58,
      nullable: true,
      name: "SUBSCRIPTION_DURATION_TEXT",
    },
    hasSubscription: {
      type: Number,
      nullable: true,
      name: "HAS_SUBSCRIPTION",
    },
  },
});

module.exports = { TwitchStreaksView };