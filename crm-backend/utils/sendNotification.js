const Notification = require('../models/Notification');

const sendNotification = async (email, message, app = null) => {
  try {
    // 🗃️ Save in DB
    const notification = await Notification.create({ email, message });

    // 🔴 Emit via Socket.IO
    if (app) {
      const io = app.get('io');
      const userSockets = io?._userSockets;

      // ✅ Multiple sockets per user (future-proof)
      const sockets = userSockets?.get(email);
      if (sockets && Array.isArray(sockets)) {
        sockets.forEach(socketId => io.to(socketId).emit('new-notification', notification));
      } else if (typeof sockets === 'string') {
        io.to(sockets).emit('new-notification', notification);
      }
    }

    return notification;
  } catch (err) {
    console.error('❌ Failed to send notification:', err.message);
  }
};

module.exports = sendNotification;
