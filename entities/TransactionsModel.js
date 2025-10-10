const { EntitySchema } = require("typeorm");

const Transactions = new EntitySchema({
  name: "Transactions",
  tableName: "TRANSACTIONS",
  columns: {
    transactionId: {
      type: Number,
      primary: true,
      nullable: false,
      name: "TRANSACTION_ID",
    },
    balanceId: {
      type: Number,
      nullable: false,
      name: "BALANCE_ID",
    },
    transactionType: {
      type: Number,
      nullable: false,
      name: "TRANSACTION_TYPE",
    },
    amount: {
      type: Number,
      nullable: false,
      name: "AMOUNT",
    },
    transactionDate: {
      type: String,
      nullable: true,
      name: "TRANSACTION_DATE",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { Transactions };