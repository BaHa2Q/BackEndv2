const { EntitySchema } = require("typeorm");

const VwActiveUserTokensInfo = new EntitySchema({
  name: "VwActiveUserTokensInfo",
  tableName: "VW_ACTIVE_USER_TOKENS_INFO",
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
    refreshToken: {
      type: String,
      length: 255,
      nullable: false,
      name: "REFRESH_TOKEN",
    },
    scopes: {
      type: String,
      length: 427,
      nullable: true,
      name: "SCOPES",
    },
    nameLogin: {
      type: String,
      length: 100,
      nullable: true,
      name: "NAME_LOGIN",
    },
    displayName: {
      type: String,
      length: 100,
      nullable: true,
      name: "DISPLAY_NAME",
    },
    profileImageUrl: {
      type: String,
      length: 500,
      nullable: true,
      name: "PROFILE_IMAGE_URL",
    },
    isjoin: {
      type: Number,
      nullable: true,
      name: "ISJOIN",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { VwActiveUserTokensInfo };