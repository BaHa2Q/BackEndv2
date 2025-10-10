const { EntitySchema } = require("typeorm");

const UserSetting = new EntitySchema({
  name: "UserSetting",
  tableName: "USER_SETTING",
  columns: {
    userId: {
      type: String,
      length: 50,
      primary: true,
      nullable: false,
      name: "USER_ID",
    },
    isStreaming: {
      type: Number,
      nullable: true,
      name: "IS_STREAMING",
    },
    isBotActive: {
      type: Number,
      nullable: true,
      name: "IS_BOT_ACTIVE",
    },
    isNotifyActive: {
      type: Number,
      nullable: true,
      name: "IS_NOTIFY_ACTIVE",
    },
    isSoundNotify: {
      type: Number,
      nullable: true,
      name: "IS_SOUND_NOTIFY",
    },
    showFavorites: {
      type: Number,
      nullable: true,
      name: "SHOW_FAVORITES",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserSetting };