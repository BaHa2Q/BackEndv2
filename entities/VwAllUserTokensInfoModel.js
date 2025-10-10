const e = require("express");
const { EntitySchema } = require("typeorm");

const VwAllUserTokensInfo = new EntitySchema({
  name: "VwAllUserTokensInfo",
  tableName: "VW_ALL_USER_TOKENS_INFO",
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
    isStreaming: {
      type: Number,
      nullable: true,
      name: "IS_STREAMING",
    },
    email: {
      type: String,
      length: 100,
      nullable: true,
      name: "EMAIL",
    },
    isSubscribed: {
      type: Number,
      nullable: true,
      name: "IS_SUBSCRIBED",
    },
    language: {
      type: String,
      nullable: true,
      name: "LANGUAGE",
    },
    isFirstJoin: {
      type: Number,
      nullable: true,
      name: "ISFIRSTJOIN",
    },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { VwAllUserTokensInfo };