const { EntitySchema } = require("typeorm");

const Games = new EntitySchema({
  name: "Games",
  tableName: "GAMES",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelName: {
      type: String,
      length: 100,
      nullable: false,
      name: "CHANNEL_NAME",
    },
    gameCode: {
      type: String,
      length: 10,
      nullable: false,
      name: "GAME_CODE",
    },
    gameId: {
      type: String,
      length: 20,
      nullable: false,
      name: "GAME_ID",
    },
    createdAt: {
      type: String,
      nullable: false,
      name: "CREATED_AT",
    },
    status: {
      type: Number,
      nullable: false,
      name: "STATUS",
  }
  },
});

module.exports = { Games };