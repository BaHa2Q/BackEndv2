const { EntitySchema } = require("typeorm");

const TwitchStreaks = new EntitySchema({
  name: "TwitchStreaks",
  tableName: "TWITCH_STREAKS",
  columns: {
    channelId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "CHANNEL_ID",
    },
    channelName: {
      type: String,
      length: 100,
      nullable: true,
      name: "CHANNEL_NAME",
    },
    userId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "USER_ID",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    streak: {
      type: Number,
      nullable: true,
      name: "STREAK",
    },
    previousStreak: {
      type: Number,
      nullable: true,
      name: "PREVIOUS_STREAK",
    },
    lastStreamTime: {
      type: String,
      nullable: true,
      name: "LAST_STREAM_TIME",
    },
  },
});

module.exports = { TwitchStreaks };