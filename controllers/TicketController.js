const { Ticket } = require("../entities/TicketModel");
const { Attachment } = require("../entities/AttachmentModel");
const { AppDataSource } = require("../data-source");

// إضافة تذكرة
const addTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { department, priority, subject, message, username, email, status } = req.body;
    const files = req.files;

    const ticketRepo = AppDataSource.getRepository(Ticket);
    const attachmentRepo = AppDataSource.getRepository(Attachment);

    // دالة توليد ticketId فريد من 6 أرقام
    async function generateUniqueTicketId() {
      let ticketId;
      let exists = true;

      while (exists) {
        ticketId = Math.floor(100000 + Math.random() * 900000).toString(); // 6 أرقام
        const existing = await ticketRepo.findOne({ where: { ticketId } });
        exists = !!existing;
      }

      return ticketId;
    }

    const ticketId = await generateUniqueTicketId();
    const ticket = ticketRepo.create({
      ticketId,
      department,
      priority,
      subject,
      message,
      username,
      userId,
      userEmail: email,
      status: status || "Open",
    });
    await ticketRepo.save(ticket);

    // حفظ المرفقات إذا موجودة
    if (files && files.length > 0) {
      const attachments = files.map(file =>
        attachmentRepo.create({
          ticket,
          fileName: file.originalname,
          fileData: file.buffer,
          fileType: file.mimetype,
        })
      );
      await attachmentRepo.save(attachments);
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// جلب تذاكر المستخدم
const getTicketById = async (req, res) => {
  try {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const userId = req.user.id;

    const tickets = await ticketRepo.find({
      where: { userId },
      relations: ["attachments"],
    });

    // لو ما فيه تذاكر، ارجع مصفوفة فارغة
    res.status(200).json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// حذف تذكرة ومرفقاتها
const deleteTicket = async (req, res) => {
  try {
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const ticketId = req.params.id;

    const ticket = await ticketRepo.findOne({ where: { ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticketRepo.remove(ticket);

    res.status(200).json({ success: true, message: "Ticket deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addTicket, getTicketById, deleteTicket };
