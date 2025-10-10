const { EntitySchema } = require("typeorm");

const Bots = new EntitySchema({
  name: "Bots",
  tableName: "BOTS",
  columns: {
    username: {
      type: String,
      length: 255,
  
      nullable: true,
      name: "USERNAME",
    },
    channelId: {
      type: String,
      length: 255,
          primary: true,
      nullable: false,
      name: "CHANNEL_ID",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { Bots };