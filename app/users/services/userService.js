const User = require('../models/userModel');

// Tìm người dùng theo email
const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (err) {
    throw new Error('Lỗi khi tìm người dùng');
  }
};
// Tạo user mới
const createUser = async (userData) => {
  try {
    const newUser = new User(userData);
    return await newUser.save();
  } catch (err) {
    console.error('Error creating new user:', err);
    throw err;
  }
};
module.exports = {
  findUserByEmail,
  createUser,
};
