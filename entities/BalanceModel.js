const { EntitySchema } = require("typeorm");

const Balance = new EntitySchema({
  name: "Balance",
  tableName: "BALANCE",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    channelId: {
      type: Number,
      nullable: true,
      name: "CHANNEL_ID",
    },
    walletBalance: {
      type: Number,
      nullable: true,
      name: "WALLET_BALANCE",
    },
    lastRecharge: {
      type: "timestamp",
      nullable: true,
      name: "LAST_RECHARGE",
    },
    createdAt: {
      type: String,
      nullable: true,
      name: "CREATED_AT",
    },
    cumulativeBalance: {
      type: Number,
      nullable: true,
      name: "CUMULATIVE_BALANCE",
    },
  },
});

module.exports = { Balance };