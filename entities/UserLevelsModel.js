const { EntitySchema } = require("typeorm");

const UserLevels = new EntitySchema({
  name: "UserLevels",
  tableName: "USER_LEVELS",
  columns: {
    channelId: {
      type: String,
      length: 50,
      primary: true,
      nullable: true,
      name: "CHANNEL_ID",
    },
    userId: {
      type: String,
      length: 50,
      nullable: true,
      name: "USER_ID",
    },
    levels: {
      type: Number,
      nullable: true,
      name: "LEVELS",
    },
    xp: {
      type: Number,
      nullable: true,
      name: "XP",
    },
    createat: {
      type: String,
      nullable: true,
      name: "CREATEAT",
    },
    updateat: {
      type: String,
      nullable: true,
      name: "UPDATEAT",
    },
    username: {
      type: String,
      length: 60,
      nullable: true,
      name: "USERNAME",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserLevels };