const { EntitySchema } = require("typeorm");

const BlockedPlayers = new EntitySchema({
  name: "BlockedPlayers",
  tableName: "BLOCKED_PLAYERS",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    username: {
      type: String,
      length: 100,
      nullable: false,
      name: "USERNAME",
    },
    channelName: {
      type: String,
      length: 100,
      nullable: false,
      name: "CHANNEL_NAME",
    },
    blockedAt: {
      type: String,
      nullable: true,
      name: "BLOCKED_AT",
    },
  },
});

module.exports = { BlockedPlayers };