const User = require('../models/userModel');
const nodemailer = require('nodemailer');
require('dotenv').config();
const cloudinary = require('../../../config/cloudinary');
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

exports.uploadAvatar = async (userId, file) => {
  const folderName = 'users'; // Upload to a specific folder in Cloudinary

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If the user has an existing avatar, delete it from Cloudinary
    if (user.avatarUrl) {
      // Extract public ID from the avatar URL using regex
      const publicIdMatch = user.avatarUrl.match(/\/([^/]+)\.[a-z]{3,4}$/);
      if (publicIdMatch && publicIdMatch[1]) {
        const publicId = publicIdMatch[1]; // The public ID is before the file extension

        console.log('publicId', publicId);

        // Delete the old avatar from Cloudinary
        await cloudinary.uploader.destroy(`users/${publicId}`);
      }
    }

    // Upload the new avatar to Cloudinary
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folderName,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          console.log('result', result);
          resolve(result.secure_url); // Return the URL of the uploaded image
        }
      );
      stream.end(file.buffer); // Pass the file buffer for upload
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
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
