require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const twilio = require('twilio');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const User = require('./models/user');
const Feedback = require('./models/feedback');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/feedback', (req, res) => {
  res.sendFile(__dirname + '/feedback.html');
});

app.post('/submit-feedback', async (req, res) => {
  // Destructure all the necessary properties from req.body
  const { username, email, phone, experience, feedbackMessage } = req.body;

  const feedback = new Feedback(req.body);

  try {
    await feedback.save();

    // Logging the feedback details
    console.log('Name:', username);
    console.log('Email:', email);
    console.log('Phone Number:', phone);
    console.log('Experience:', experience);
    console.log('Feedback message:', feedbackMessage); // Fixed this line

    res.send('Thank you for your feedback!');
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).send('Error saving feedback.');
  }
});

app.post('/send-otp', async (req, res) => {
  const phone = req.body.phone;
  const secret = speakeasy.generateSecret().base32;
  const token = speakeasy.totp({ secret: secret, digits: 4 });

  console.log(`Generated OTP for ${phone}: ${token}`);

  let user = await User.findOne({ phoneNumber: phone });
  if (user) {
    user.otp = token;
    await user.save();
  } else {
    user = new User({ phoneNumber: phone, otp: token });
    await user.save();
  }

  client.messages
    .create({ body: `Your OTP is: ${token}`, from: '+12106258101', to: phone })
    .then(() => res.send('OTP sent!'))
    .catch(() => res.status(400).send('Error sending OTP'));
});

app.post('/validate-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    console.error(`User not found for phone number: ${phoneNumber}`);
    return res.status(400).send('User not found');
  }

  console.log(`Stored OTP for ${phoneNumber}: ${user.otp}`);
  console.log(`Received OTP for ${phoneNumber}: ${otp}`);

  if (user.otp === otp) {
    console.log(`OTP validated for ${phoneNumber}`);
    return res.send('OTP validated successfully');
  } else {
    console.error(`Invalid OTP attempt for ${phoneNumber}`);
    return res.status(400).send('Invalid OTP');
  }
});

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
    });
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startServer();
