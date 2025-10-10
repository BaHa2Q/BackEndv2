const { EntitySchema } = require("typeorm");

const BotLogsView = new EntitySchema({
  name: "BotLogsView",
  tableName: "BOT_LOGS_VIEW",
  columns: {
    logId: {
      type: String,
      length: 36,
      primary: true,
      nullable: true,
      name: "LOG_ID",
    },
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
    logTimestamp: {
      type: String,
      nullable: true,
      name: "LOG_TIMESTAMP",
    },
    type: {
      type: String,
      length: 40,
      nullable: true,
      name: "TYPE",
    },
    formattedTimestamp: {
      type: String,
      length: 19,
      nullable: true,
      name: "FORMATTED_TIMESTAMP",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { BotLogsView };