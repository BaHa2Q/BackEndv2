const { EntitySchema } = require("typeorm");

const Subscriptionplans = new EntitySchema({
  name: "Subscriptionplans",
  tableName: "SUBSCRIPTIONPLANS",
  columns: {
    planid: {
      type: Number,
      primary: true,
      nullable: false,
      name: "PLANID",
    },
    planname: {
      type: String,
      length: 50,
      nullable: false,
      name: "PLANNAME",
    },
    durationmonths: {
      type: Number,
      nullable: false,
      name: "DURATIONMONTHS",
    },
    price: {
      type: Number,
      nullable: false,
      name: "PRICE",
    },
  },
});

module.exports = { Subscriptionplans };