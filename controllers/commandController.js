
const { AppDataSource } = require("../data-source");
const { Commands } = require("../entities/CommandsModel");
const { CommandTimer } = require("../entities/CommandTimerModel");

const { v4: uuidv4 } = require("uuid");
const getCommand = async (req, res) => {
  const channelId = req.user.id;
  const {platformId} = req.user;

  try {
    const repo = AppDataSource.getRepository(Commands);

    // جلب جميع الأوامر المرتبطة بـ channel_id
    const commands = await repo.find({
      where: { channelId: channelId,platformId },
    });

    res.status(200).json(commands);
  } catch (err) {
    console.error('Error retrieving command data:', err);
    res.status(500).send('An error occurred while retrieving command data');
  }
};
const getCommandById = async (req, res) => {
    const channelId = req.user.id;
  const id = req.params.id;

  try {
    const repo = AppDataSource.getRepository(Commands);

    const command = await repo.findOne({
      where: {
        channelId,
        id,
      },
    });

    res.status(200).json(command);
  } catch (err) {
    console.error("Error in getCommandById:", err);
    throw err;
  }
}

const createCommand = async (req, res) => {
  const channelId = req.user.id;
  const channelName = req.user.login;
  const {platformId} = req.user;
  const {
    id, 
    commandName,
    responseText,
    roleId,
    delay
  } = req.body;

  if (
    !channelId ||
    !commandName ||
    !responseText ||
    !roleId ||
    !delay
  ) {
    return res.status(400).send("All fields are required");
  }

  try {
    const commandRepository = AppDataSource.getRepository(Commands);

    const timestamp = new Date();

    const newCommand = commandRepository.create({
      id: id || uuidv4(),
      channelId,
      channelName:channelName,
      commandName,
      responseText,
      roleId,
       delay,
       active: 1,
      createdBy: channelId,
      updatedBy: channelId,
      createdAt: timestamp,
      platformId
    });

    await commandRepository.save(newCommand);

    res.status(201).send("Command saved successfully via TypeORM");
  } catch (error) {
    console.error("Error saving command:", error);
    res.status(500).send("Error saving command");
  }
};


const updateCommand = async (req, res) => {
  const id = req.params.id;
  const channelId = req.user.id;
  const { commandName, responseText, roleId, active, delay } = req.body;

  try {
    const repo = AppDataSource.getRepository(Commands);
    const command = await repo.findOneBy({ id,  channelId });

    if (!command) {
      return res.status(404).json({ error: "Command not found" });
    }

    // التحديث حسب أسماء الأعمدة الفعلية في قاعدة البيانات أو الكلاس
    command.commandName = commandName;
    command.responseText = responseText;
    command.roleId = roleId;
    command.active = active;
    command.delay = delay;
    command.updatedBy = String(channelId); // إذا كانت من نوع VARCHAR
    command.updatedAt = new Date();

    await repo.save(command);

    res.status(200).json({
      message: "Command updated successfully",
      updatedCommand: command, // عرض بيانات التعديل
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// حذف أمر
const deleteCommand = async (req, res) => {
  const id = req.params.id; // تأكد من التحويل إذا id رقم
  const channelId = req.user.id;
const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(Commands);
    const command = await repo.find({
      where: { id, channelId,platformId },
    });

    if (!command) {
      return res.status(404).json({ error: "Command not found" });
    }

    await repo.remove(command);
    return res.status(200).json({ message: "Command deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addTimer = async (req, res) => {
  const channelId = req.user.id;
const {command,message,intervalMinutes,chatLines,status} = req.body;
  const {platformId} = req.user;

 
    
  try {
    const repo = AppDataSource.getRepository(CommandTimer);

    const count = await repo.count({ where: { channelId } });

    if (count >= 15) {
      return res.status(403).json({ error: "Maximum of 15 timer commands allowed per channel" });
    }

const newTimer = repo.create({
  id: uuidv4(),
  channelId,
  command,
  name:null,
  message,
  intervalMinutes,
  chatLines,
  status: status ?? 1,platformId
});
    await repo.save(newTimer);

    res.status(201).json({ message: "Timer command inserted successfully" });
  } catch (err) {
    console.error("Error inserting timer command:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getTimers = async (req, res) => {
  const channelId = req.user.id;
const {platformId} = req.user;
  try {
    const repo = AppDataSource.getRepository(CommandTimer);
    const timers = await repo.find({ where: { channelId,platformId } });

    res.status(200).json(timers);
  } catch (err) {
    console.error("Error retrieving timer commands:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const updateTimer = async (req, res) => {
  const channelId = req.user.id;
  const timerId = req.params.id;

  const {
    command,
    name,
    message,
    intervalMinutes,
    chatLines,
    status,
  } = req.body;

  try {
    const repo = AppDataSource.getRepository(CommandTimer);

    const timer = await repo.findOneBy({ id: timerId, channelId });

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    repo.merge(timer, {
      command,
      name,
      message,
      intervalMinutes,
      chatLines,
      status,
    });

    await repo.save(timer);

    res.status(200).json({ message: "Timer command updated successfully" });
  } catch (err) {
    console.error("Error updating timer command:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const deleteTimer = async (req, res) => {
  const channelId = req.user.id;
  const timerId = req.params.id;
  
  try {
    const repo = AppDataSource.getRepository(CommandTimer);

    const timer = await repo.findOneBy({ id: timerId, channelId });

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    await repo.remove(timer);

    res.status(200).json({ message: "Timer command deleted successfully" });
  } catch (err) {
    console.error("Error deleting timer command:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {getCommand,getCommandById,createCommand,updateCommand,deleteCommand,addTimer,getTimers,updateTimer,deleteTimer}