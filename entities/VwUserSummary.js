const { EntitySchema } = require("typeorm");

const VwUserSummary = new EntitySchema({
  name: "VwUserSummary",
  tableName: "VW_USER_SUMMARY",
  columns: {
    username: {
      type: String,
      length: 255,
      nullable: true,
       primary: true,
      name: "USERNAME",
    },
    channelId: {
      type: String,
      length: 255,
      nullable: true,
     
      name: "CHANNELID",
    },
    userId: {
      type: String,
      length: 255,
      nullable: true,
     
      name: "USERID",
    },
    streak: {
      type: Number,
      nullable: true,
      name: "STREAK",
    },
    level: {
      type: Number,
      nullable: true,
      name: "LEVEL",
    },
    timewatch: {
      type: Number,
      nullable: true,
      name: "TIMEWATCH",
    },
    subscriptionCount: {
      type: Number,
      nullable: false,
      name: "SUBSCRIPTION_COUNT",
    },
    subscriptionDurationText: {
      type: String,
      length: 255,
      nullable: true,
      name: "SUBSCRIPTION_DURATION_TEXT",
    },
    hasSubscription: {
      type: Number,
      nullable: false,
      name: "HAS_SUBSCRIPTION",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { VwUserSummary };
