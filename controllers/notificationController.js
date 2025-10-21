const { AppDataSource } = require("../data-source");
const { NotificationStream } = require("../entities/NotificationStreamModel");
const { StreamDays } = require("../entities/StreamDaysModel");
const { v4: uuidv4 } = require("uuid");
const saveNotification = async ({userId,streamId,title,broadcasterName,broadcasterLogin,avatar,color,platformId}) => {
  try {
    const repo = AppDataSource.getRepository(NotificationStream);

    const notification = repo.create({
      eventId:uuidv4(),
      userId,
      streamId,
      streamTitle:title,
      broadcasterName,
      broadcasterLogin,
      broadcasterAvatar:avatar,
      color,
      isSeen: 0,
      platformId
      // STARTED_AT يتم تعيينه تلقائيًا بفضل @CreateDateColumn
    });

    await repo.save(notification);
    
    console.log(`✅ Notification saved for ${broadcasterName}`);
  } catch (err) {
    console.error("❌ Error saving notification to DB:", err.message);
  }
};
const startStream = async  (stream_id, channel_id, stream_date,platformId)=> {
  try {

    const dateObj = new Date(stream_date);
    if (isNaN(dateObj.getTime()))
      throw new Error("stream_date is not a valid date");
    await AppDataSource.query(
      `BEGIN start_stream_session(  :channel_id, :stream_date,:streamId,:platformId); END;`,
      [  channel_id, dateObj,stream_id,platformId]
    );

    console.log(`✅ Stream Stream`);
  } catch (err) {
    console.error("❌ Error saving Stream to DB:", err.message);
  }
};
const endStream = async ( channel_id, stream_date) => {
  try {
    if (!stream_date) throw new Error("stream_date is missing or invalid");

    const dateObj = new Date(stream_date);
    if (isNaN(dateObj.getTime()))
      throw new Error("stream_date is not a valid date");
    // مررها كـ Date مباشرة لـ Oracle
    await AppDataSource.query(
      `BEGIN end_stream_session(  :channel_id, :stream_date); END;`,
      [  channel_id, dateObj]
    );
  console.log(`✅ End Stream`);
  } catch (err) {
    console.error(
      `❌ خطأ أثناء تحديث الستريك لـ :`,
      err.message
    );
  }
};

async function getUserColor(userId, apiClient) {
    try {

        // جلب لون المستخدم في الدردشة
        const color = await apiClient.chat.getColorForUser(userId);
        return color; 
    } catch (err) {
        console.error('Error fetching user color:', err);
        return null;
    }
}



module.exports ={startStream,endStream,saveNotification,getUserColor}