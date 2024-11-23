const User = require('../models/userModel');
const nodemailer = require('nodemailer');
require('dotenv').config();
exports.findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

exports.sendActivationEmail = async (email, activationToken, req) => {
  const activationURL = `${req.protocol}://${req.get(
    'host'
  )}/activate/${activationToken}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    to: email,
    subject: 'Kích hoạt tài khoản của bạn',
    html: `
      <p>Xin chào,</p>
      <p>Vui lòng nhấp vào liên kết dưới đây để kích hoạt tài khoản của bạn:</p>
      <a href="${activationURL}">Kích hoạt tài khoản</a>
      <p>Liên kết sẽ hết hạn sau 10 phút.</p>
    `,
  };

  await transporter.sendMail(message);
};

// Tìm user qua activation token
exports.findUserByActivationToken = async (hashedToken) => {
  return await User.findOne({
    activationToken: hashedToken,
    activationTokenExpires: { $gt: Date.now() }, // Token phải còn hiệu lực
  });
};
