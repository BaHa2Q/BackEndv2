const { EntitySchema } = require("typeorm");

const LogType = new EntitySchema({
  name: "LogType",
  tableName: "LOG_TYPE",
  columns: {
    name: {
      type: String,
      length: 40,
      primary: true,
      nullable: true,
      name: "NAME",
    },
    type: {
      type: Number,
      nullable: true,
      name: "TYPE",
    },
  },
});

module.exports = { LogType };