const { AppDataSource } = require("../data-source");
const { UserFavorite } = require("../entities/UserFavoriteModel");

async function showWhoAddFavorite(broadcasterId, platformId) {
  try {
    const repo = AppDataSource.getRepository(UserFavorite);
    const records = await repo.find({
      where: { userId: broadcasterId, platformId },
      select: ["channelId"],
    });
    return records.map(r => r.channelId);
  } catch (err) {
    console.error("❌ Error loading favorites:", err);
    return [];
  }
}

module.exports = { showWhoAddFavorite };
