const { EntitySchema } = require("typeorm");

const CommandTimer = new EntitySchema({
  name: "CommandTimer",
  tableName: "COMMAND_TIMER",
  columns: {
    id: {
      type: String,
      length: 200,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: String,
      length: 20,
      nullable: false,
      name: "CHANNEL_ID",
    },
    command: {
      type: String,
      length: 100,
      nullable: false,
      name: "COMMAND",
    },
    name: {
      type: String,
      length: 100,
      nullable: true,
      name: "NAME",
    },
    message: {
      type: String,
      length: 100,
      nullable: false,
      name: "MESSAGE",
    },
    intervalMinutes: {
      type: Number,
      nullable: false,
      name: "INTERVAL_MINUTES",
    },
    chatLines: {
      type: Number,
      nullable: false,
      name: "CHAT_LINES",
    },
    status: {
      type: Number,
      nullable: true,
      name: "STATUS",
    },
    createdAt: {
      type: String,
      nullable: false,
      name: "CREATED_AT",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { CommandTimer };