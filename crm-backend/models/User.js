const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
