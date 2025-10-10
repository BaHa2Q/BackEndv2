const { EntitySchema } = require("typeorm");

const TwitchMessages = new EntitySchema({
  name: "TwitchMessages",
  tableName: "TWITCH_MESSAGES",
  columns: {
    id: {
      type: String,
      length: 100,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: String,
      length: 100,
      nullable: false,
      name: "CHANNEL_ID",
    },
    channelName: {
      type: String,
      length: 100,
      nullable: true,
      name: "CHANNEL_NAME",
    },
    userId: {
      type: String,
      length: 100,
      nullable: false,
      name: "USER_ID",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    displayName: {
      type: String,
      length: 100,
      nullable: true,
      name: "DISPLAY_NAME",
    },
    messageText: {
      type: String,
      length: 4000,
      nullable: true,
      name: "MESSAGE_TEXT",
    },
    messageDate: {
      type: String,
      nullable: true,
      name: "MESSAGE_DATE",
    },
    threadId: {
      type: String,
      length: 100,
      nullable: true,
      name: "THREAD_ID",
    },
    parentId: {
      type: String,
      length: 100,
      nullable: true,
      name: "PARENT_ID",
    },
    parentUsername: {
      type: String,
      length: 100,
      nullable: true,
      name: "PARENT_USERNAME",
    },
    parentText: {
      type: String,
      length: 4000,
      nullable: true,
      name: "PARENT_TEXT",
    },
    streamid: {
      type: String,
      length: 20,
      nullable: true,
      name: "STREAMID",
    },
    isstream: {
      type: Number,
      nullable: true,
      name: "ISSTREAM",
    },
    color: {
      type: String,
      nullable: true,
      name: "COLOR",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { TwitchMessages };