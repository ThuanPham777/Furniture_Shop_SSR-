const User = require('../models/userModel');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
exports.findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Tìm người dùng theo ID
exports.findUserById = async (userId) => {
  return User.findById(userId);
};

// Cập nhật thông tin người dùng
exports.updateUser = async (userId, updateData) => {
  return User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
};

exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

// Xử lý upload avatar
exports.uploadAvatar = async (file) => {
  // Hạn chế các loại file hợp lệ
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.');
  }

  // Đường dẫn đến thư mục đã có sẵn
  const uploadDir = path.join(__dirname, '../../../public/img/Users');

  // Kiểm tra xem thư mục đã tồn tại hay chưa (trong trường hợp bạn muốn tự động tạo thư mục nếu chưa tồn tại)
  if (!fs.existsSync(uploadDir)) {
    // Nếu thư mục chưa tồn tại, tạo thư mục
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  // Đặt tên file và đường dẫn lưu file
  const uploadPath = path.join(uploadDir, file.originalname);

  // Lưu file vào thư mục
  await fs.promises.writeFile(uploadPath, file.buffer);

  // Trả về URL của hình ảnh để có thể truy cập từ trình duyệt
  return `/img/Users/${file.originalname}`;
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

exports.sendPasswordResetEmail = async (email, resetToken, req) => {
  // Create reset URL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/reset-password/${resetToken}`;

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    to: email,
    subject: 'Đặt lại mật khẩu của bạn',
    html: `
        <p>Xin chào,</p>
        <p>Nhấn vào liên kết dưới đây để đặt lại mật khẩu:</p>
        <a href="${resetURL}">${resetURL}</a>
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

/**
 * Find user by reset token and ensure the token is still valid.
 * @param {string} hashedToken - The hashed reset password token.
 * @returns {Promise<User|null>} - The user if found and the token is valid, otherwise null.
 */
exports.findUserByResetToken = async (hashedToken) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure the token is not expired
    });

    return user;
  } catch (error) {
    console.error('Error finding user by reset token:', error);
    throw new Error('Unable to find user with the provided reset token.');
  }
};
