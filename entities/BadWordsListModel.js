const { EntitySchema } = require("typeorm");

const BadWordsList = new EntitySchema({
  name: "BadWordsList",
  tableName: "BAD_WORDS_LIST",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelid: {
      type: String,
      length: 20,
      nullable: false,
      name: "CHANNELID",
    },
    words: {
      type: String,
      length: 4000,
      nullable: true,
      name: "WORDS",
    },
  },
});

module.exports = { BadWordsList };