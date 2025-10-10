const { EntitySchema } = require("typeorm");

const UserStreaks = new EntitySchema({
  name: "UserStreaks",
  tableName: "USER_STREAKS",
  columns: {
    userId: {
      type: String,
      length: 100,
      primary: true,
      nullable: false,
      name: "USER_ID",
    },
    channelId: {
      type: String,
      length: 100,
      primary: true,
      nullable: false,
      name: "CHANNEL_ID",
    },
    lastDate: {
      type: "timestamp",
      nullable: false,
      name: "LAST_DATE",
    },
    streakCount: {
      type: Number,
      nullable: true,
      name: "STREAK_COUNT",
    },
    userName: {
      type: String,
      length: 100,
      nullable: true,
      name: "USER_NAME",
    },
    prevStreak: {
      type: Number,
      nullable: true,
      name: "PREV_STREAK",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserStreaks };