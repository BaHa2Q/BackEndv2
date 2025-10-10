const { EntitySchema } = require("typeorm");

const Players = new EntitySchema({
  name: "Players",
  tableName: "PLAYERS",
  columns: {
    playerId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "PLAYER_ID",
    },
    gameId: {
      type: Number,
      nullable: true,
      name: "GAME_ID",
    },
    username: {
      type: String,
      length: 100,
      nullable: true,
      name: "USERNAME",
    },
    joinedAt: {
      type: "timestamp",
      nullable: true,
      name: "JOINED_AT",
  }
  },
});

module.exports = { Players };