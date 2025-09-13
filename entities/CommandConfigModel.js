const { EntitySchema } = require("typeorm");

const CommandConfig = new EntitySchema({
  name: "CommandConfig",
  tableName: "COMMAND_CONFIG",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    action: {
      type: String,
      length: 100,
      nullable: false,
      name: "ACTION",
    },
    channelId: {
      type: String,
      length: 50,
      nullable: false,
      name: "CHANNEL_ID",
    },
    defaults: {
      type: String,
      length: 100,
      nullable: false,
      name: "DEFAULTS",
    },

    typeId: {
      type: Number,
      nullable: true,
      name: "TYPE_ID",
    },
    roleId: {
      type: Number,
      nullable: true,
      name: "ROLE_ID",
    },
  },
});

module.exports = { CommandConfig };