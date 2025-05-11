const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const sendNotification = require('../utils/sendNotification');

// ✅ تسجيل مستخدم جديد
router.post('/register', authController.register);

// ✅ تسجيل الدخول مع JWT + role + إشعار
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('📥 Login Request:', { email, password }); // ✅ Debug

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Incorrect password');
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ سجل النشاط وأرسل إشعار
    await ActivityLog.create({
      userEmail: user.email,
      action: '✅ Logged in',
    });

    await sendNotification(user.email, '✅ Welcome back!', req.app);

    res.json({
      message: '✅ Login successful',
      token,
      user: {
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Login Error:', err); // ✅ نزيدو التفاصيل
    res.status(500).json({ error: '❌ Login failed' });
  }
});

// ✅ تغيير كلمة السر (يتطلب القديمة)
router.post('/update-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    await ActivityLog.create({
      userEmail: email,
      action: '🔐 Password updated',
    });

    await sendNotification(email, '🔐 Your password was updated', req.app);

    res.json({ message: '✅ Password updated successfully' });
  } catch (err) {
    console.error('❌ Password Update Error:', err); // ✅ log هنا أيضا
    res.status(500).json({ error: '❌ Failed to update password' });
  }
});

// ✅ رفع صورة البروفايل (Placeholder)
router.post('/upload-avatar', authController.uploadAvatar);

// ✅ إعادة تعيين كلمة السر بدون الباسورد القديم
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    await ActivityLog.create({
      userEmail: email,
      action: '🔑 Password reset (no old password)',
    });

    await sendNotification(email, '🔑 Password was reset', req.app);

    res.json({ message: '✅ Password reset successfully' });
  } catch (err) {
    console.error('❌ Password Reset Error:', err); // ✅
    res.status(500).json({ error: '❌ Failed to reset password' });
  }
});

module.exports = router;
