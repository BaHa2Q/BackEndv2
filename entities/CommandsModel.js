const { EntitySchema } = require("typeorm");

const Commands = new EntitySchema({
  name: "Commands",
  tableName: "COMMANDS",
  columns: {
    id: {
      type: String,
      length: 200,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: Number,
      nullable: false,
      name: "CHANNEL_ID",
    },
    channelName: {
      type: String,
      length: 20,
      nullable: false,
      name: "CHANNEL_NAME",
    },
    commandName: {
      type: String,
      length: 50,
      nullable: false,
      name: "COMMAND_NAME",
    },
    responseText: {
      type: String,
      length: 1000,
      nullable: false,
      name: "RESPONSE_TEXT",
    },
    createdAt: {
      type: String,
      length: 50,
      nullable: true,
      name: "CREATED_AT",
    },
    updatedAt: {
      type: String,
      length: 50,
      nullable: true,
      name: "UPDATED_AT",
    },
    createdBy: {
      type: String,
      length: 50,
      nullable: true,
      name: "CREATED_BY",
    },
    updatedBy: {
      type: String,
      length: 50,
      nullable: true,
      name: "UPDATED_BY",
    },
    roleId: {
      type: Number,
      nullable: true,
      name: "ROLE_ID",
    },
    active: {
      type: Number,
      nullable: true,
      name: "ACTIVE",
    },
    delay: {
      type: Number,
      nullable: true,
      name: "DELAY",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { Commands };