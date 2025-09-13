const { EntitySchema } = require("typeorm");

const Attachment = new EntitySchema({
  name: "Attachment",
  tableName: "TICKET_ATTACHMENTS",
  columns: {
    attachmentId: {
      type: Number,
      primary: true,
      generated: true,
      name: "ATTACHMENT_ID",
    },
    fileName: {
      type: String,
      length: 255,
      nullable: false,
      name: "FILE_NAME",
    },
    fileData: {
      type: "blob",
      nullable: false,
      name: "FILE_DATA",
    },
    fileType: {
      type: String,
      length: 100,
      nullable: true,
      name: "FILE_TYPE",
    },
    uploadedAt: {
      type: "timestamp",
      createDate: true,
      name: "UPLOADED_AT",
    },
  },
  relations: {
    ticket: {
      type: "many-to-one",
      target: "Ticket",
      joinColumn: { name: "TICKET_ID" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = { Attachment };
