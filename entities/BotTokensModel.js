const { EntitySchema } = require("typeorm");

const BotTokens = new EntitySchema({
  name: "BotTokens",
  tableName: "BOT_TOKENS",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    accessToken: {
      type: String,
      length: 512,
      nullable: false,
      name: "ACCESS_TOKEN",
    },
    refreshToken: {
      type: String,
      length: 512,
      nullable: false,
      name: "REFRESH_TOKEN",
    },
    expiresIn: {
      type: Number,
      nullable: false,
      name: "EXPIRES_IN",
    },
    obtainmentTimestamp: {
      type: Number,
      nullable: false,
      name: "OBTAINMENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      nullable: true,
      name: "UPDATED_AT",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { BotTokens };