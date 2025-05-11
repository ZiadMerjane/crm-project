const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: String
});

module.exports = mongoose.model('Revenue', revenueSchema);
