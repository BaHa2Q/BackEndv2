const { EntitySchema } = require("typeorm");

const Ticket = new EntitySchema({
  name: "Ticket",
  tableName: "SUPPORT_TICKETS",
  columns: {
    ticketId: {
      type: String,
      length: 5,
      primary: true,
      name: "TICKET_ID",
    },
    department: { 
      type: String,
      length: 20,
      nullable: true,
      name: "DEPARTMENT",
    },
    priority: {
      type: String,
      length: 20,
      nullable: true,
      name: "PRIORITY",
    },
    subject: {
      type: String,
      length: 255,
      nullable: false,
      name: "SUBJECT",
    },
    message: {
      type: String,
      length: 4000, // بدال clob حطينا length كبير
      nullable: false,
      name: "MESSAGE",
    },
    username: {
      type: String,
      length: 150,
      nullable: true,
      name: "USERNAME",
    },
    userId: {
      type: String,
      length: 150,
      nullable: false,
      name: "USER_ID",
    },
    userEmail: {
      type: String,
      length: 150,
      nullable: true,
      name: "USER_EMAIL",
    },
    status: {
      type: String,
      length: 20,
      nullable: true,
      name: "STATUS",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      name: "CREATED_AT",
  },
    platformId: {
      type: Number,
      nullable: true,
      name: "PLATFORM_ID",
    },
  },
  relations: {
    attachments: {
      type: "one-to-many",
      target: "Attachment",
      inverseSide: "ticket",
      cascade: true,
    },
  },
});

module.exports = { Ticket };
