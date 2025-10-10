const { EntitySchema } = require("typeorm");

const UserTokens = new EntitySchema({
  name: "UserTokens",
  tableName: "USER_TOKENS",
  columns: {
    channelId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "CHANNEL_ID",
    },
    accessToken: {
      type: String,
      length: 255,
      nullable: false,
      name: "ACCESS_TOKEN",
    },
    
    username: {
      type: String,
      length: 255,
      nullable: false,
      name: "USERNAME",
    },
    refreshToken: {
      type: String,
      length: 255,
      nullable: false,
      name: "REFRESH_TOKEN",
    },
    updatedAt: {
      type: String,
      nullable: true,
      name: "UPDATED_AT",
    },
    scopes: {
      type: String,
      length: 427,
      nullable: true,
      name: "SCOPES",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserTokens };