const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const sendNotification = async (email, message) => {
  try {
    await Notification.create({ userEmail: email, message });
  } catch (err) {
    console.error('❌ Notification failed:', err);
  }
};

// ✅ تسجيل مستخدم جديد
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();
    await sendNotification(email, '👋 Welcome! Your account has been created.');

    res.status(201).json({ message: '✅ User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Registration failed' });
  }
};

// ✅ تسجيل الدخول
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: '❌ Login failed' });
  }
};

// ✅ تغيير كلمة السر
exports.updatePassword = async (req, res) => {
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

    await sendNotification(email, '🔐 Your password was updated');

    res.json({ message: '✅ Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to update password' });
  }
};

// ✅ إعادة تعيين كلمة السر
exports.resetPassword = async (req, res) => {
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

    await sendNotification(email, '🔑 Your password was reset (without old password)');

    res.json({ message: '✅ Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to reset password' });
  }
};

// ✅ رفع صورة بروفايل (Placeholder)
exports.uploadAvatar = async (req, res) => {
  try {
    res.json({ message: '✅ Avatar uploaded (simulated)' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to upload avatar' });
  }
};
