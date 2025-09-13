const { Server } = require("socket.io");

let io;
const favoriteChannels = new Map();
const recentNotifications = new Set();

setInterval(() => {
  recentNotifications.clear();
}, 5 * 60 * 1000);

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("registerChannel", (channelId) => {
      if (channelId) {
        favoriteChannels.set(socket.id, String(channelId));
        console.log(`⭐ Registered channel ${channelId} from socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
      favoriteChannels.delete(socket.id);
    });
  });
}

function emitSocketEvent(type, payload) {
  if (io) {
    io.emit(type, payload);
  }
}

function getFavoriteChannels() {
  return favoriteChannels;
}
function getIO() {
  return io;
}

module.exports = {
  setupSocket,
  emitSocketEvent,
  getFavoriteChannels,  getIO

};
