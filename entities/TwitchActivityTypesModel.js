const { EntitySchema } = require("typeorm");

const TwitchActivityTypes = new EntitySchema({
  name: "TwitchActivityTypes",
  tableName: "TWITCH_ACTIVITY_TYPES",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    label: {
      type: String,
      length: 100,
      nullable: true,
      name: "LABEL",
    },
    color: {
      type: String,
      length: 20,
      nullable: true,
      name: "COLOR",
    },
    description: {
      type: String,
      length: 200,
      nullable: true,
      name: "DESCRIPTION",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { TwitchActivityTypes };