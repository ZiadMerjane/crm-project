const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  amount: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Revenue', revenueSchema);
