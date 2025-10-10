const { EntitySchema } = require("typeorm");

const BadWordsList = new EntitySchema({
  name: "BadWordsList",
  tableName: "BAD_WORDS_LIST",
  columns: {

    channelId: {
      type: String,
      length: 20,
      nullable: false,
      primary: true,
      name: "CHANNELID",
    },
    words: {
      type: String,
      length: 4000,
      nullable: true,
      name: "WORDS",
    },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },

  },
});

module.exports = { BadWordsList };