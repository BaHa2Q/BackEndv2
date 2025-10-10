const { EntitySchema } = require("typeorm");

const LatestStreamsPerDay = new EntitySchema({
  name: "LatestStreamsPerDay",
  tableName: "LATEST_STREAMS_PER_DAY",
  columns: {
    streamId: {
      type: String,
      length: 100,
      primary: true,
      nullable: false,
      name: "STREAM_ID",
    },
    broadcasterName: {
      type: String,
      length: 100,
      nullable: true,
      name: "BROADCASTER_NAME",
    },
    startedAt: {
      type: String,
      nullable: true,
      name: "STARTED_AT",
  }
  },
});

module.exports = { LatestStreamsPerDay };