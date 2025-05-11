const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const Revenue = require('../models/Revenue');
const verifyToken = require('../middleware/auth');
const ExcelJS = require('exceljs');

// ✅ Dashboard stats
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.countDocuments();
    const contacts = await Contact.countDocuments();
    const messages = await Message.countDocuments();
    const revenueData = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({ users, contacts, messages, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ✅ Revenue chart
router.get('/revenue', verifyToken, async (req, res) => {
  const view = req.query.view || 'monthly'; // daily | monthly | yearly
  let groupFormat;

  if (view === 'daily') groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  else if (view === 'yearly') groupFormat = { $dateToString: { format: '%Y', date: '$date' } };
  else groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };

  try {
    const data = await Revenue.aggregate([
      { $group: { _id: groupFormat, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load revenue chart data' });
  }
});

// ✅ Export revenue chart as JSON or Excel
router.get('/revenue/export/:type', verifyToken, async (req, res) => {
  const view = req.query.view || 'monthly';
  const type = req.params.type;

  let groupFormat;
  if (view === 'daily') groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  else if (view === 'yearly') groupFormat = { $dateToString: { format: '%Y', date: '$date' } };
  else groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };

  try {
    const data = await Revenue.aggregate([
      { $group: { _id: groupFormat, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);

    if (type === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=revenue-${view}.json`);
      return res.json(data);
    }

    if (type === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Revenue');

      sheet.columns = [
        { header: 'Period', key: '_id', width: 20 },
        { header: 'Total Revenue', key: 'total', width: 20 },
      ];

      sheet.addRows(data);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=revenue-${view}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(400).json({ error: 'Invalid export type' });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// ✅ Seed fake data
router.post('/seed', async (req, res) => {
  try {
    // Revenues
    await Revenue.insertMany([
      { amount: 250, date: new Date('2025-01-15'), category: 'Website' },
      { amount: 400, date: new Date('2025-02-20'), category: 'CRM' },
      { amount: 180, date: new Date('2025-03-05'), category: 'Consulting' },
      { amount: 300, date: new Date('2025-04-12'), category: 'E-commerce' },
      { amount: 500, date: new Date('2025-05-09'), category: 'Support' },
    ]);

    // Messages
    await Message.insertMany([
      { from: 'client1@example.com', subject: 'Hello', content: 'Can you help me?' },
      { from: 'admin@example.com', subject: 'Reminder', content: 'Meeting tomorrow at 10am' },
    ]);

    res.status(201).json({ message: '✅ Fake data inserted successfully!' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to seed data' });
  }
});

module.exports = router;
