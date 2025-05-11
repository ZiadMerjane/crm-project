const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const verifyToken = require('../middleware/auth');

// 🔍 بحث عام في contacts + messages
router.get('/', verifyToken, async (req, res) => {
  const { q } = req.query;
  const searchRegex = new RegExp(q, 'i');

  try {
    const contacts = await Contact.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    });

    const messages = await Message.find({
      $or: [
        { from: searchRegex },
        { subject: searchRegex },
        { content: searchRegex },
      ],
    });

    res.json({ contacts, messages });
  } catch (err) {
    res.status(500).json({ error: '❌ Search failed' });
  }
});

module.exports = router;
