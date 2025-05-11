const Notification = require('../models/Notification');

const sendNotification = async (email, message, app = null) => {
  try {
    const notification = await Notification.create({ userEmail: email, message });

    // ✅ Real-time emit via Socket.IO (if app موجود)
    if (app) {
      const io = app.get('io');
      const userSockets = io?._userSockets;
      const socketId = userSockets?.get(email);
      if (socketId) {
        io.to(socketId).emit('new-notification', notification);
      }
    }

    return notification;
  } catch (err) {
    console.error('❌ Failed to send notification:', err);
  }
};

module.exports = sendNotification;
