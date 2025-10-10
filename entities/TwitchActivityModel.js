const { EntitySchema } = require("typeorm");

// نوع الحدث
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
      length: 50,
      nullable: true,
      name: "COLOR",
    },
    description: {
      type: String,
      length: 500,
      nullable: true,
      name: "DESCRIPTION",
  }
  },
  relations: {
    activities: {
      target: "TwitchActivity",
      type: "one-to-many",
      inverseSide: "type",
    },
  },
});

// النشاط (الحدث)
const TwitchActivity = new EntitySchema({
  name: "TwitchActivity",
  tableName: "TWITCH_ACTIVITY",
  columns: {
     ActivityId: {
      type: String,
      primary: true,
      nullable: false,
      name: "ACTIVITYID",
    },
    broadcasterId: {
      type: String,
      length: 100,
      nullable: true,
      name: "BROADCASTERID",
    },
    broadcasterUsername: {
      type: String,
      length: 100,
      nullable: true,
      name: "BROADCASTERUSERNAME",
    },
    moderatorId: {
      type: String,
      length: 100,
      nullable: true,
      name: "MODERATORID",
    },
    moderatorUsername: {
      type: String,
      length: 100,
      nullable: true,
      name: "MODERATORUSERNAME",
    },
    userId: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERID",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    reason: {
      type: String,
      length: 500,
      nullable: true,
      name: "REASON",
    },
    eventTime: {
      type: String,
      nullable: true,
      name: "EVENT_TIME",
    },
    typeId: {
      type: Number,
      nullable: true,
      name: "TYPEID",
    },
    counts: {
      type: Number,
      nullable: true,
      name: "COUNTS",
    },
    createdAt: {
      type: String,
      nullable: true,
      name: "CREATED_AT",
    },
    avatar: {
      type: String,
      length: 255,
      nullable: true,
      name: "AVATARS",
    },
      note: {
      type: String,
      length: 255,
      nullable: true,
      name: "NOTE",
    },
      displayName: {
      type: String,
      length: 255,
      nullable: true,
      name: "DISPLAYNAME",
    },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
  relations: {
    type: {
      target: "TwitchActivityTypes",
      type: "many-to-one",
      joinColumn: { name: "TYPEID" },
      nullable: true,
    },
  },
});

module.exports = { TwitchActivity, TwitchActivityTypes };
