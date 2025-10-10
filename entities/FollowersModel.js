const { EntitySchema } = require("typeorm");

const Followers = new EntitySchema({
  name: "Followers",
  tableName: "FOLLOWERS",
  columns: {
    userId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "USER_ID",
    },
    userLogin: {
      type: String,
      length: 50,
      nullable: true,
      name: "USER_LOGIN",
    },
    userName: {
      type: String,
      length: 50,
      nullable: true,
      name: "USER_NAME",
    },
    followedAt: {
      type: String,
      nullable: true,
      name: "FOLLOWED_AT",
    },
    lastFollowed: {
      type: String,
      nullable: true,
      name: "LAST_FOLLOWED",
    },
    profileImage: {
      type: String,
      length: 255,
      nullable: true,
      name: "PROFILE_IMAGE",
    },
    notfollownow: {
      type: Number,
      nullable: true,
      name: "NOTFOLLOWNOW",
  }
  },
});

module.exports = { Followers };