const { EntitySchema } = require("typeorm");

const CommandDefault = new EntitySchema({
  name: "CommandDefault",
  tableName: "COMMAND_DEFAULT",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    action: {
      type: String,
      length: 100,
      nullable: false,
      name: "ACTION",
    },
    defaults: {
      type: String,
      length: 100,
      nullable: false,
      name: "DEFAULTS",
    },
    tpyeId: {
      type: Number,
      nullable: false,
      name: "TPYE_ID",
    },
  },
});

module.exports = { CommandDefault };