const { EntitySchema } = require("typeorm");

const Config = new EntitySchema({
  name: "Config",
  tableName: "CONFIG",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    text: {
      type: String,
      length: 100,
      nullable: true,
      name: "TEXT",
    },
    description: {
      type: String,
      length: 200,
      nullable: true,
      name: "DESCRIPTION",
    },
    icon: {
      type: String,
      length: 50,
      nullable: true,
      name: "ICON",
    },
    typeid: {
      type: Number,
      nullable: true,
      name: "TYPEID",
    },
  },
});

module.exports = { Config };