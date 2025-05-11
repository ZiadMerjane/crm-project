const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const Revenue = require('../models/Revenue');
const verifyToken = require('../middleware/auth');
const ExcelJS = require('exceljs');

// ✅ Dashboard stats (optional route)
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

// ✅ Revenue chart by view (daily/monthly/yearly)
router.get('/revenue', verifyToken, async (req, res) => {
  const view = req.query.view || 'monthly';
  let groupFormat;

  if (view === 'daily') {
    groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  } else if (view === 'yearly') {
    groupFormat = { $dateToString: { format: '%Y', date: '$date' } };
  } else {
    groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
  }

  try {
    const data = await Revenue.aggregate([
      { $group: { _id: groupFormat, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load revenue data' });
  }
});

// ✅ Export chart as JSON or Excel
router.get('/revenue/export/:type', verifyToken, async (req, res) => {
  const view = req.query.view || 'monthly';
  const type = req.params.type;

  let groupFormat;
  if (view === 'daily') {
    groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  } else if (view === 'yearly') {
    groupFormat = { $dateToString: { format: '%Y', date: '$date' } };
  } else {
    groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
  }

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
    res.status(500).json({ error: 'Failed to export revenue data' });
  }
});

// ✅ Seed route for test data (call manually in dev)
router.post('/seed', async (req, res) => {
  try {
    await Revenue.insertMany([
      { amount: 200, date: new Date('2025-01-15'), category: 'Website' },
      { amount: 350, date: new Date('2025-02-20'), category: 'CRM' },
      { amount: 150, date: new Date('2025-03-05'), category: 'Consulting' },
      { amount: 400, date: new Date('2025-04-12'), category: 'E-commerce' },
      { amount: 500, date: new Date('2025-05-09'), category: 'Support' },
    ]);

    await Message.insertMany([
      { from: 'client1@example.com', subject: 'Hello', content: 'Need a quote please.' },
      { from: 'client2@example.com', subject: 'Help', content: 'Can you assist me?' },
    ]);

    res.status(201).json({ message: '✅ Seed data inserted successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to seed data' });
  }
});

module.exports = router;
