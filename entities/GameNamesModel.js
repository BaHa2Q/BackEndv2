const { EntitySchema } = require("typeorm");

const GameNames = new EntitySchema({
  name: "GameNames",
  tableName: "GAME_NAMES",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    gameName: {
      type: String,
      length: 100,
      nullable: false,
      name: "GAME_NAME",
  }
  },
});

module.exports = { GameNames };