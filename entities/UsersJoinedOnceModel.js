const { EntitySchema } = require("typeorm");

const UsersJoinedOnce = new EntitySchema({
  name: "UsersJoinedOnce",
  tableName: "USERS_JOINED_ONCE",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: String,
      length: 255,
      nullable: true,
      name: "CHANNEL_ID",
    },
    username: {
      type: String,
      length: 255,
      nullable: true,
      name: "USERNAME",
    },
    userId: {
      type: String,
      length: 255,
      nullable: true,
      name: "USER_ID",
    },
    joinedAt: {
      type: String,
      nullable: true,
      name: "JOINED_AT",
    },
  },
});

module.exports = { UsersJoinedOnce };