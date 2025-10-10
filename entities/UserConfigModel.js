const { EntitySchema } = require("typeorm");

const UserConfig = new EntitySchema({
  name: "UserConfig",
  tableName: "USER_CONFIG",
  columns: {
    channelId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "CHANNEL_ID",
    },
    status: {
      type: Number,
      nullable: true,
      name: "STATUS",
    },
    configId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "CONFIG_ID",
    },
    roleId: {
      type: Number,
      nullable: true,
      name: "ROLE_ID",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserConfig };