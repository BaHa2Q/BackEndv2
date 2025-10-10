const { EntitySchema, Timestamp } = require("typeorm");

const UserFavorite = new EntitySchema({
  name: "UserFavorite",
  tableName: "USER_FAVORITE",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: String,
      length: 100,
      nullable: false,
      name: "CHANNEL_ID",
    },
    userId: {
      type: String,
      length: 100,
      nullable: false,
      name: "USER_ID",
    },
    login: {
      type: String,
      length: 255,
      nullable: false,
      name: "LOGIN",
    },
    displayName: {
      type: String,
      length: 255,
      nullable: true,
      name: "DISPLAY_NAME",
    },
    broadcasterType: {
      type: String,
      length: 255,
      nullable: true,
      name: "BROADCASTER_TYPE",
    },
    description: {
      type: String,
      length: 4000,
      nullable: true,
      name: "DESCRIPTION",
    },
    profileImageUrl: {
      type: String,
      length: 1024,
      nullable: true,
      name: "PROFILE_IMAGE_URL",
    },
    color: {
      type: String,
      length: 20,
      nullable: true,
      name: "COLOR",
    },
    totalFollowers: {
      type: Number,
      nullable: true,
      name: "TOTAL_FOLLOWERS",
    },
    isPrivate: {
      type: Number,
      nullable: true,
      name: "PRIVATE",
    },
    notifications: {
      type: Number,
      nullable: false,
      default: 0,
      name: "NOTIFICATIONS",
    },
    createdAt:{
      type:Date,
      nullable:true,
      name:"CREATED_DATE"
    },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  }
});

module.exports = { UserFavorite };