const Notification = require('../models/Notification');

const createNotification = async (req, res) => {
  try {
    const { email, message } = req.body;
    const notif = await Notification.create({ email, message });

    // ⏱️ Emit real-time notif via socket.io
    const io = req.app.get('io');
    io.emit('notification', notif);

    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const email = req.user.email;
    const notifs = await Notification.find({ email }).sort({ timestamp: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
};
