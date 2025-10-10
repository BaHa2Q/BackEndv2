const { EntitySchema } = require("typeorm");

const UserLiveMessages = new EntitySchema({
  name: "UserLiveMessages",
  tableName: "USER_LIVE_MESSAGES",
  columns: {
    id: {
      type: String,
      primary: true,
      nullable: false,
      name: "ID",
    },
    streamid: {
      type: Number,
      nullable: true,
      name: "STREAMID",
    },
    channelId: {
      type: Number,
      nullable: false,
      name: "CHANNEL_ID",
    },
    userId: {
      type: Number,
      nullable: false,
      name: "USER_ID",
    },
    username: {
      type: String,
      length: 40,
      nullable: true,
      name: "USERNAME",
    },
    messageDate: {
      type: "timestamp",
      nullable: true,
      name: "MESSAGE_DATE",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserLiveMessages };