const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');
const verifyToken = require('../middleware/auth');
const sendNotification = require('../utils/sendNotification');

// 📥 Get paginated messages
router.get('/', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const total = await Message.countDocuments();
    const messages = await Message.find()
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch messages' });
  }
});

// 🗑 Delete message
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });

    await ActivityLog.create({
      userEmail: deleted.from,
      action: `🗑 Deleted message: ${deleted.subject}`,
    });

    await sendNotification(deleted.from, `🗑 Message deleted: ${deleted.subject}`, req.app);

    res.json({ message: '✅ Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to delete message' });
  }
});

// 💬 Reply
router.post('/reply', verifyToken, async (req, res) => {
  const { to, subject, content } = req.body;

  await ActivityLog.create({
    userEmail: to,
    action: `📨 Replied to message: ${subject}`,
  });

  await sendNotification(to, `📨 You received a reply: "${subject}"`, req.app);

  res.json({ message: '✅ Reply sent (simulation)' });
});

// 📤 Export messages
router.get('/export/:type', verifyToken, async (req, res) => {
  const messages = await Message.find().sort({ date: -1 });

  if (req.params.type === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename=messages.json');
    return res.json(messages);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Messages');

  sheet.columns = [
    { header: 'From', key: 'from', width: 30 },
    { header: 'Subject', key: 'subject', width: 40 },
    { header: 'Content', key: 'content', width: 60 },
    { header: 'Date', key: 'date', width: 25 },
  ];

  messages.forEach(msg => sheet.addRow(msg));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=messages.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
