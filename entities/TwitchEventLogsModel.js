const { EntitySchema } = require("typeorm");

const TwitchEventLogs = new EntitySchema({
  name: "TwitchEventLogs",
  tableName: "TWITCH_EVENT_LOGS",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    eventType: {
      type: String,
      length: 50,
      nullable: true,
      name: "EVENT_TYPE",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    targetUser: {
      type: String,
      length: 100,
      nullable: true,
      name: "TARGET_USER",
    },
    pointsUsed: {
      type: Number,
      nullable: true,
      name: "POINTS_USED",
    },
    tier: {
      type: String,
      length: 10,
      nullable: true,
      name: "TIER",
    },
    durationSec: {
      type: Number,
      nullable: true,
      name: "DURATION_SEC",
    },
    reason: {
      type: String,
      length: 400,
      nullable: true,
      name: "REASON",
    },
    eventTime: {
      type: String,
      nullable: true,
      name: "EVENT_TIME",
    },
  },
});

module.exports = { TwitchEventLogs };