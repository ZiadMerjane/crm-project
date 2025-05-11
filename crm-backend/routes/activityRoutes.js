const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');
const verifyToken = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');



// ✅ تسجيل نشاط
router.post('/log', async (req, res) => {
  const { userEmail, action } = req.body;
  try {
    await ActivityLog.create({ userEmail, action });
    res.json({ message: '✅ Activity logged' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to log activity' });
  }
});

// ✅ جلب النشاطات مع فلترة + Pagination
router.get('/', verifyToken, async (req, res) => {
  const { email, filter, page = 1, limit = 10 } = req.query;

  let startDate;
  const now = new Date();

  if (filter === 'today') {
    startDate = new Date(now.setHours(0, 0, 0, 0));
  } else if (filter === 'last7') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (filter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const query = {};
  if (email) query.userEmail = email;
  if (startDate) query.timestamp = { $gte: startDate };

  try {
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch logs' });
  }
});

// ✅ تصدير Excel / JSON
router.get('/export/:type', verifyToken, async (req, res) => {
  const { email, filter } = req.query;

  let startDate;
  const now = new Date();

  if (filter === 'today') {
    startDate = new Date(now.setHours(0, 0, 0, 0));
  } else if (filter === 'last7') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (filter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const query = {};
  if (email) query.userEmail = email;
  if (startDate) query.timestamp = { $gte: startDate };

  const logs = await ActivityLog.find(query).sort({ timestamp: -1 });

  if (req.params.type === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename=activity.json');
    return res.json(logs);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Activity Logs');

  sheet.columns = [
    { header: 'User Email', key: 'userEmail', width: 30 },
    { header: 'Action', key: 'action', width: 50 },
    { header: 'Timestamp', key: 'timestamp', width: 30 },
  ];

  logs.forEach(log => sheet.addRow(log));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=activity.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// ✅ حذف جميع السجلات
router.delete('/clear', verifyToken, adminOnly, async (req, res) => {
  try {
    const user = req.user?.email || 'unknown';

    await ActivityLog.deleteMany({});

    await ActivityLog.create({
      userEmail: user,
      action: '🧹 Cleared all activity logs',
    });

    res.json({ message: '✅ All logs cleared' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to clear logs' });
  }
});

module.exports = router;
