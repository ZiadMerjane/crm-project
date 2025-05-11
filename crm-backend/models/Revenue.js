const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  amount: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Revenue', RevenueSchema);
