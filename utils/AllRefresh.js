const { AppDataSource } = require('../data-source');
const { UserTokens } = require('../entities/UserTokensModel');
const AllRefresh = async () => {
  try {
    const repo = AppDataSource.getRepository(UserTokens);

    // جلب كل السجلات من جدول UserToken
    const tokens = await repo.find();

    if (!tokens || tokens.length === 0) {
      return null;
    }


    return tokens;
  } catch (err) {
    console.error("Error fetching tokens:", err);
    return null;
  }
};

module.exports = AllRefresh
