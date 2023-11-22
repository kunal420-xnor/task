const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  otp: {
    type: String,
  },
  secret: {
    type: String,
  },
});

module.exports = mongoose.model('User', userSchema);
