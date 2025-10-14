const { AppDataSource } = require("../data-source");
const { BadWordsList } = require("../entities/BadWordsListModel");
const { Bots } = require("../entities/BotsModel");

require('dotenv').config(); // Load environment variables

// GET - جلب الكلمات الممنوعة
const badWordGet = async (req, res) => {
  try {
    const channelId = req.user.id;
    const repo = AppDataSource.getRepository(BadWordsList);

    const badWords = await repo.findOne({ where: { channelId } });

    if (!badWords || !badWords.words) {
      return res.status(200).json([]); // <-- رجّع array فاضي
    }

    const wordsArray = badWords.words
      .split(":")
      .map((w) => w.trim())
      .filter(Boolean);

    res.status(200).json(wordsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching bad words");
  }
};



// POST - إضافة كلمات جديدة
const badWordPost = async (req, res) => {
  try {
    const channelId = req.user.id;
    const { words } = req.body;
    const {platformId} = req.user
    // لازم يكون Array
    if (!Array.isArray(words)) {
      return res.status(400).json({ message: "Invalid bad words." });
    }

    const newWordsArray = words.map(w => w.trim()).filter(Boolean);

    const repo = AppDataSource.getRepository(BadWordsList);
    let badWords = await repo.findOne({ where: { channelId,platformId } });

    if (badWords) {
      // تعديل: نعيد الكتابة بدل الإضافة
      badWords.words = newWordsArray.join(":");
      await repo.save(badWords);
      return res.status(200).json(newWordsArray);
    } else {
      badWords = repo.create({ channelId, words: newWordsArray.join(":"),platformId });
      await repo.save(badWords);
      return res.status(201).json(newWordsArray);
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating bad words");
  }
};

const botsGet = async (req, res) => {
  const {platformId} = req.user
  const channelId = req.user.id;
  try {
    const repo = AppDataSource.getRepository(Bots);
    const bots = await repo.findOne({ where: { channelId, platformId } });    
    if (!bots || !bots.username) {
      return res.status(200).json([]); // array فاضي
    }

    const usernames = bots.username.split(":").map(u => u.trim()).filter(Boolean);
    res.status(200).json(usernames);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching bots");
  }
};


const botsPost = async (req, res) => {
  try {
    const { id: channelId, platformId } = req.user;
    const { bots } = req.body;

    if (!Array.isArray(bots)) {
      return res.status(400).json({ message: "Invalid bots list." });
    }

    const newBotsArray = bots
      .map(b => b.trim().toLowerCase())
      .filter(Boolean);

    const botsString = newBotsArray.join(":");

    const repo = AppDataSource.getRepository(Bots);

    // البحث عن السجل الحالي
    let existingBots = await repo.findOne({ where: { channelId, platformId } });

    if (existingBots) {
      // تحديث السجل الموجود
      await repo.update({ channelId, platformId }, { username: botsString });
    } else {
      // إنشاء سجل جديد
      const newEntry = repo.create({ channelId, username: botsString, platformId });
      await repo.save(newEntry);
    }

    return res.status(200).json(newBotsArray);
  } catch (err) {
    console.error("Error updating bots:", err);
    return res.status(500).send("Error updating bots");
  }
};



module.exports = { badWordGet, badWordPost, botsGet, botsPost };
