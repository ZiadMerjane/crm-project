const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/auth');

// ✅ جلب Notifications ديال المستخدم
router.get('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const notifications = await Notification.find({ email }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch notifications' });
  }
});

// ✅ إضافة Notification + Emit real-time
router.post('/', verifyToken, async (req, res) => {
  const { message } = req.body;
  try {
    const email = req.user.email;
    const notification = await Notification.create({ email, message });

    // 🔴 Send real-time via Socket.IO
    const io = req.app.get('io');
    io.emit('notification', notification);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to create notification' });
  }
});

// ✅ تعليم كمقروء
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to update notification' });
  }
});

// ✅ حذف Notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: '✅ Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to delete notification' });
  }
});

module.exports = router;
