const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
