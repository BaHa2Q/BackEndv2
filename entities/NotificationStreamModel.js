const { EntitySchema } = require("typeorm");

const NotificationStream = new EntitySchema({
  name: "NotificationStream",
  tableName: "NOTIFICATION_STREAM",
  columns: {
    eventId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "EVENT_ID",
    },
    userId: {
      type: String,
      length: 100,
      nullable: false,
      name: "USER_ID",
    },
    streamId: {
      type: String,
      length: 100,
      nullable: false,
      name: "STREAM_ID",
    },
    streamTitle: {
      type: String,
      length: 255,
      nullable: true,
      name: "STREAM_TITLE",
    },
    broadcasterName: {
      type: String,
      length: 100,
      nullable: true,
      name: "BROADCASTER_NAME",
    },
    broadcasterAvatar: {
      type: String,
      length: 255,
      nullable: true,
      name: "BROADCASTER_AVATAR",
    },
    color: {
      type: String,
      length: 20,
      nullable: true,
      name: "COLOR",
    },
    startedAt: {
      type: String,
      nullable: true,
      name: "STARTED_AT",
    },
    isSeen: {
      type: Number,
      nullable: true,
      name: "IS_SEEN",
    },
  },
});

module.exports = { NotificationStream };