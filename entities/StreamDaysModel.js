const { EntitySchema } = require("typeorm");

const StreamDays = new EntitySchema({
  name: "StreamDays",
  tableName: "STREAM_DAYS",
  columns: {
    streamId: {
      type: String,
      length: 100,
      primary: true,
      nullable: false,
      name: "STREAM_ID",
    },
    streamDate: {
      type: "timestamp",
      primary: true,
      nullable: false,
      name: "STREAM_DATE",
    },
    channelId: {
      type: String,
      length: 20,
      nullable: true,
      name: "CHANNEL_ID",
    },
    platformId: {
      type: Number,
      nullable: false,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { StreamDays };