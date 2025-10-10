const { EntitySchema } = require("typeorm");

const UserJoins = new EntitySchema({
  name: "UserJoins",
  tableName: "USER_JOINS",
  columns: {
    channelId: {
      type: Number,
      primary: true,
      nullable: true,
      name: "CHANNEL_ID",
    },
    channelName: {
      type: String,
      length: 255,
      nullable: true,
      name: "CHANNEL_NAME",
    },
    username: {
      type: String,
      length: 255,
      nullable: true,
      name: "USERNAME",
    },
    joinDate: {
      type: "timestamp",
      nullable: true,
      name: "JOIN_DATE",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserJoins };