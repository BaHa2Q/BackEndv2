const { EntitySchema } = require("typeorm");

const UserSubscriptions = new EntitySchema({
  name: "UserSubscriptions",
  tableName: "USER_SUBSCRIPTIONS",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    userId: {
      type: String,
      length: 20,
      nullable: false,
      name: "USER_ID",
    },
    planId: {
      type: Number,
      nullable: false,
      name: "PLAN_ID",
    },
    startDate: {
      type: String,
      nullable: false,
      name: "START_DATE",
    },
    endDate: {
      type: String,
      nullable: false,
      name: "END_DATE",
    },
    isGift: {
      type: Number,
      nullable: true,
      name: "IS_GIFT",
    },
    senderId: {
      type: String,
      length: 20,
      nullable: true,
      name: "SENDER_ID",
    },
    giftMessage: {
      type: String,
      length: 255,
      nullable: true,
      name: "GIFT_MESSAGE",
    },
    isendsub: {
      type: Number,
      nullable: false,
      name: "ISENDSUB",
    },
    isActive: {
      type: Number,
      nullable: false,
      name: "IS_ACTIVE",
    },
    createdAt: {
      type: String,
      nullable: false,
      name: "CREATED_AT",
    },
    updatedAt: {
      type: String,
      nullable: false,
      name: "UPDATED_AT",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { UserSubscriptions };