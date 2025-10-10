const { EntitySchema, Timestamp } = require("typeorm");

const UserChannels = new EntitySchema({
  name: "UserChannels",
  tableName: "USER_CHANNELS",
  columns: {
    channelId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "CHANNEL_ID",
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
    createdAt: {
      type: String,
      nullable: true,
      name: "CREATED_AT",
    },
    firstJoin: {
      type: String,
      nullable: true,
      name: "FIRST_JOIN",
    },
    lastJoin: {
      type: String,
      nullable: true,
      name: "LAST_JOIN",
    },
    email: {
      type: String,
      nullable: true,
      name: "EMAIL",
    },
    language: {
      type: String,
      nullable: true,
      name: "LANGUAGE",
    },
     isFirstJoin:{
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
  relations: {
    settings: {
      type: "one-to-one",
      target: "UserSetting", // نفس الاسم اللي معرفه في UserSetting
      joinColumn: {
        name: "CHANNEL_ID", // العمود في جدول UserChannels
        referencedColumnName: "userId", // العمود في UserSetting
      },
      cascade: true,
    },
  },
});

module.exports = { UserChannels };
