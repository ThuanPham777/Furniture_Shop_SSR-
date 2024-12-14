const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userService = require('../services/userService');
const crypto = require('crypto');
const passport = require('passport');
const upload = require('../../../config/upload');

const {
  ensureAuthenticated,
} = require('../../../middleware/auth/ensureAuthenticated');
// Trang đăng ký
router.get('/signup', (req, res) => res.render('auth/signup'));

// Trang đăng nhập
router.get('/login', (req, res) => res.render('auth/login'));

//  Trang profile
router.get('/profile', (req, res) => res.render('auth/profile'));

// Xử lý đăng ký
router.post('/signup', userController.signup);

// Xử lý đăng nhập
router.post('/login', userController.login);

// Xử lý đăng xuất
router.get('/logout', userController.logout);

router.get('/activate/:token', userController.activateAccount);

// GET: Forgot Password Form
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { error: null });
});

router.post('/forgot-password', userController.forgotPassword);

// GET: Reset Password Form
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await userService.findUserByResetToken(hashedToken);

  if (!user) {
    return res.render('auth/reset-password', {
      error: 'Liên kết không hợp lệ hoặc đã hết hạn!',
    });
  }

  res.render('auth/reset-password', { token, error: null });
});

router.post('/reset-password/:token', userController.resetPassword);

// Google Login Route
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callback Route
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful login, redirect to home
    res.redirect('/');
  }
);

router.post(
  '/profile/edit',
  ensureAuthenticated,
  upload.single('avatar'),
  userController.editProfile
);
router.post(
  '/profile/change-password',
  ensureAuthenticated,
  userController.changePassword
);

module.exports = router;
