const { EntitySchema } = require("typeorm");

const MenuItems = new EntitySchema({
  name: "MenuItems",
  tableName: "MENU_ITEMS",
  columns: {
    id: {
      type: Number,
      primary: true,
      nullable: false,
      name: "ID",
    },
    text: {
      type: String,
      length: 255,
      nullable: false,
      name: "TEXT",
    },
    icon: {
      type: String,
      length: 50,
      nullable: false,
      name: "ICON",
    },
    link: {
      type: String,
      length: 255,
      nullable: true,
      name: "LINK",
    },
    parentid: {
      type: Number,
      nullable: true,
      name: "PARENTID",
    },
    subscription: {
      type: Number,
      nullable: true,
      name: "SUBSCRIPTION",
    },
    active: {
      type: Number,
      nullable: true,
      name: "ACTIVE",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
});

module.exports = { MenuItems };