// controllers/userController.js
const bcrypt = require('bcryptjs');
const passport = require('passport');
const userService = require('../services/userService'); // Import user service

exports.signup = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  try {
    // Check if passwords match
    if (password !== passwordConfirm) {
      return res.redirect('/signup');
    }

    // Check if email already exists
    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      return res.redirect('/signup');
    }

    // Create new user (password will be hashed in pre('save') middleware)
    await userService.createUser({
      username,
      email,
      password,
    });

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/signup');
  }
};

// Xử lý đăng nhập
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return res.redirect('/login');
    }
    if (!user) {
      console.error('Authentication failed:', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.redirect('/login');
      }
      res.redirect('/shop'); // Redirect on success
    });
  })(req, res, next);
};

// Xử lý đăng xuất
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.redirect('/login');
  });
};
