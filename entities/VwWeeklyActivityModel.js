const { EntitySchema } = require("typeorm");

const VwWeeklyActivity = new EntitySchema({
  name: "VwWeeklyActivity",
  tableName: "VW_WEEKLY_ACTIVITY",
  columns: {
    logDate: {
      type: "timestamp",
      primary: true,
      nullable: true,
      name: "LOG_DATE",
    },
    day: {
      type: String,
      length: 36,
      nullable: true,
      name: "DAY",
    },
    channelId: {
      type: String,
      length: 255,
      nullable: false,
      name: "CHANNEL_ID",
    },
    messageCount: {
      type: Number,
      nullable: true,
      name: "MESSAGE_COUNT",
    },
    commandCount: {
      type: Number,
      nullable: true,
      name: "COMMAND_COUNT",
    },
    dateFrom: {
      type: String,
      length: 10,
      nullable: true,
      name: "DATE_FROM",
    },
    dateTo: {
      type: String,
      length: 10,
      nullable: true,
      name: "DATE_TO",
    },
    totalMessageCount: {
      type: Number,
      nullable: true,
      name: "TOTAL_MESSAGE_COUNT",
    },
    totalCommandCount: {
      type: Number,
      nullable: true,
      name: "TOTAL_COMMAND_COUNT",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { VwWeeklyActivity };