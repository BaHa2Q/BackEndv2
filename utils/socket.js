const { Server } = require("socket.io");

let io;
const favoriteChannels = new Map();
const recentNotifications = new Set();

// تنظيف الإشعارات كل 5 دقائق
setInterval(() => {
  recentNotifications.clear();
}, 5 * 60 * 1000);


function setupSocket(server) {
  io = new Server(server, {
    path: "/socket.io",
    cors: {
      // السماح بالاتصال من localhost أثناء التطوير ومن الدومين عند الإنتاج
      origin: ["http://localhost:3000", "https://yallabots.com"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {

    // تسجيل القناة المفضلة لكل عميل
    socket.on("registerChannel", (channelId) => {
      if (channelId) {
        favoriteChannels.set(socket.id, String(channelId));
        // console.log(`⭐ Registered channel ${channelId} from socket ${socket.id}`);
      }
    });

    // التعامل مع فصل العميل
    socket.on("disconnect", () => {
      favoriteChannels.delete(socket.id);
    });
  });
}


function emitSocketEvent(type, payload) {
  if (io) {
    io.emit(type, payload);
  }
}

/**
 * جلب القنوات المفضلة
 */
function getFavoriteChannels() {
  return favoriteChannels;
}

/**
 * جلب الـ io object إذا احتجت تتعامل مباشرة مع Socket.IO
 */
function getIO() {
  return io;
}

module.exports = {
  setupSocket,
  emitSocketEvent,
  getFavoriteChannels,
  getIO,
};
