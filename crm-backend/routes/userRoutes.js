const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');



// ✅ جلب جميع المستخدمين
router.get('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // منرجعوش كلمة السر
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch users' });
  }
});

// ✅ تغيير الدور (role) ديال المستخدم
router.put('/:id/role', verifyToken, adminOnly, async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ message: '✅ Role updated', user });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to update role' });
  }
});

// ✅ حذف مستخدم
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: '✅ User deleted' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to delete user' });
  }
});

module.exports = router;
