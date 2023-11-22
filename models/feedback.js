const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  feedbackMessage: String,
  experience: String,
});

module.exports = mongoose.model('Feedback', feedbackSchema);
