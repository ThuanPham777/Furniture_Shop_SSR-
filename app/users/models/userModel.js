const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatarUrl: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    province: { type: String },
    city: { type: String },
    country: { type: String, default: 'Vietnam' },
    password: {
      type: String,
      required: [true, 'User password is required'],
    },
    isActive: { type: Boolean, default: false }, // Trạng thái kích hoạt
    activationToken: String,
    activationTokenExpires: Date, // Thời gian hết hạn token
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined; // Không lưu trường này
  next();
});

// Tạo token kích hoạt
userSchema.methods.createActivationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.activationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.activationTokenExpires = Date.now() + 10 * 60 * 1000; // Token hết hạn sau 10 phút
  return token;
};

// Tạo token đặt lại mật khẩu
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
