const { EntitySchema } = require("typeorm");

const UserFollowed = new EntitySchema({
  name: "UserFollowed",
  tableName: "USER_FOLLOWED",
  columns: {
    id: {
      type: String,
      length: 255,
      primary: true,
      nullable: true,
      name: "ID",
    },
    channelId: {
      type: String,
      length: 255,
      nullable: true,
      name: "CHANNEL_ID",
    },
    broadcasterId: {
      type: String,
      length: 255,
      nullable: true,
      name: "BROADCASTER_ID",
    },
    broadcasterLogin: {
      type: String,
      length: 255,
      nullable: true,
      name: "BROADCASTER_LOGIN",
    },
    broadcasterName: {
      type: String,
      length: 255,
      nullable: true,
      name: "BROADCASTER_NAME",
    },
    followedAt: {
      type: String,
      nullable: true,
      name: "FOLLOWED_AT",
    },
    profileImage: {
      type: String,
      length: 500,
      nullable: true,
      name: "PROFILE_IMAGE",
    },
    isfollowed: {
      type: Number,
      nullable: true,
      name: "ISFOLLOWED",
  }
  },
});

module.exports = { UserFollowed };