const { EntitySchema } = require("typeorm");

const BroadcasterTypes = new EntitySchema({
  name: "BroadcasterTypes",
  tableName: "BROADCASTER_TYPES",
  columns: {
    broadcasterId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "BROADCASTER_ID",
    },
    broadcasterType: {
      type: String,
      length: 50,
      nullable: false,
      name: "BROADCASTER_TYPE",
  }
  },
});

module.exports = { BroadcasterTypes };