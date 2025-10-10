const { EntitySchema } = require("typeorm");

const ViewFavoriteUsers = new EntitySchema({
  name: "ViewFavoriteUsers",
  tableName: "VIEW_FAVORITE_USERS",
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
    username: {
      type: String,
      length: 255,
      nullable: false,
      name: "USERNAME",
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
    bio: {
      type: String,
      length: 4000,
      nullable: true,
      name: "BIO",
    },
    profileImage: {
      type: String,
      length: 1024,
      nullable: true,
      name: "PROFILE_IMAGE",
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
    createdAt: {
      type: Date,
      nullable: true,
      name: "CREATED_DATE"
    },
    notifications: {
      type: Number,
      primary: true,
      nullable: false,
      name: "NOTIFICATIONS",
    },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { ViewFavoriteUsers };