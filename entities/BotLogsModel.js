const { EntitySchema } = require("typeorm");

const BotLogs = new EntitySchema({
  name: "BotLogs",
  tableName: "BOT_LOGS",
  columns: {
    channelId: {
      type: String,
      length: 255,
      nullable: false,
      name: "CHANNEL_ID",
    },
    username: {
      type: String,
      length: 255,
      nullable: false,
      name: "USERNAME",
    },
    message: {
      type: String,
      length: 4000,
      nullable: false,
      name: "MESSAGE",
    },
    typeid: {
      type: Number,
      nullable: false,
      name: "TYPEID",
    },
    logTimestamp: {
      type: String,
      nullable: true,
      name: "LOG_TIMESTAMP",
    },
    userid: {
      type: String,
      length: 20,
      nullable: true,
      name: "USERID",
    },
    firstmessage: {
      type: Number,
      nullable: true,
      name: "FIRSTMESSAGE",
    },
    isbot: {
      type: Number,
      nullable: true,
      name: "ISBOT",
    },
    logId: {
      type: String,
      length: 36,
        primary: true,
      generated: "uuid",
      nullable: true,
      name: "LOG_ID",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { BotLogs };