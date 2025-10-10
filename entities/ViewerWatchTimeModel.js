const { EntitySchema } = require("typeorm");

const ViewerWatchTime = new EntitySchema({
  name: "ViewerWatchTime",
  tableName: "VIEWER_WATCH_TIME",
  columns: {
    channelId: {
      type: String,
      length: 100,
      primary: true,
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
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    totalMinute: {
      type: Number,
      nullable: true,
      name: "TOTAL_MINUTE",
    },
    lastJoinTime: {
      type: String,
      nullable: true,
      name: "LAST_JOIN_TIME",
    },
    isCurrentlyWatching: {
      type: String,
      length: 1,
      nullable: true,
      name: "IS_CURRENTLY_WATCHING",
    },
    lastUpdated: {
      type: String,
      nullable: true,
      name: "LAST_UPDATED",
    },
    lastWriteDate: {
      type: String,
      nullable: true,
      name: "LAST_WRITE_DATE",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { ViewerWatchTime };