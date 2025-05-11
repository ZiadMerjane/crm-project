const express = require('express');
const router = express.Router();
const Revenue = require('../models/Revenue');
const verifyToken = require('../middleware/auth');

// 📥 Add fake revenue
router.post('/', verifyToken, async (req, res) => {
  try {
    const { amount, date } = req.body;
    const revenue = await Revenue.create({ amount, date });
    res.status(201).json(revenue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add revenue' });
  }
});

// 📤 Get revenue data grouped by view (daily/monthly/yearly)
router.get('/', verifyToken, async (req, res) => {
  const { view = 'monthly' } = req.query;
  const groupBy = {
    daily: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
    monthly: { $dateToString: { format: '%Y-%m', date: '$date' } },
    yearly: { $dateToString: { format: '%Y', date: '$date' } },
  }[view];

  try {
    const revenue = await Revenue.aggregate([
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get revenue data' });
  }
});

module.exports = router;
